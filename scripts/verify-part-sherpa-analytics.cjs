// Run against a local preview server. Requires Playwright (or PLAYWRIGHT_MODULE).
// API fixtures make scroll visibility and event payload assertions deterministic.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('fs');
const results=[];
(async()=>{
const browser=await chromium.launch({headless:true});
for(const {width, transport} of [{width:1440,transport:'dataLayer'},{width:390,transport:'dataLayer'},{width:1440,transport:'gtag'}]) {
 const context=await browser.newContext({viewport:{width,height:900}});
 if (transport === 'gtag') await context.addInitScript(() => {
  window.__gtagEvents = [];
  window.gtag = (command, event, params) => {
   if (command === 'event') window.__gtagEvents.push({event, ...params});
  };
 });
 const page=await context.newPage();
 let release;const gate=new Promise(r=>release=r);
 const offers=(group)=>Array.from({length:12},(_,i)=>({seller:`${group} Seller ${i+1}`,seller_name:`${group} Seller ${i+1}`,seller_key:`${group}${i+1}`,price:100+i,shipping_cost:i===0?0:5,condition:group==='New'?'New OEM':'Used',availability:i===1?'backorder':i===2?'out of stock':'in stock',product_url:`https://seller.example/${group}/${i}`,mpn:'WP8546219',exact_mpn_match:true}));
 await page.route('https://api.appliancepartgeeks.com/**',async route=>{
  await gate;
  const url=route.request().url();let data={};
  if(url.includes('/compare/new-market/'))data={status:'complete',selected_sellers:offers('New').map(r=>r.seller),offers:offers('New')};
  else if(url.includes('/refurb/'))data={used_seller_comparison:{seller_statuses:offers('Used').map(r=>({seller:r.seller,seller_key:r.seller_key,status:'complete'}))},used_seller_competitors:offers('Used')};
  else if(url.includes('/live-part-search/'))data={results:[{seller_name:'New Seller 1',seller_key:'New1',price:100,shipping_cost:0,condition:'New OEM',availability:'in stock',mpn:'WP8546219'}]};
  await route.fulfill({json:data});
 });
 await page.route('**/*googletagmanager.com/**',r=>r.abort());
 await page.route('https://seller.example/**',r=>r.fulfill({body:'Seller destination'}));
 await page.goto(`${process.env.BASE_URL || 'http://localhost:3100'}${process.env.PRODUCT_ROUTE || '/test-part-page'}`,{waitUntil:'domcontentloaded',timeout:120000});
 const block=page.locator('aside[aria-label="Compare Seller Options"]');await block.waitFor();
 await block.evaluate(e=>e.style.display='none');release();
 await page.waitForFunction(()=>document.querySelector('[data-sellers-attempted]')?.dataset.sellersAttempted==='24' && [...document.querySelectorAll('button')].some(b=>b.textContent==='Refresh'&&!b.disabled));
 const events=()=>page.evaluate(()=>(window.__gtagEvents || window.dataLayer).filter(e=>typeof e.event==='string'));
 assert.equal((await events()).filter(e=>e.event==='part_sherpa_market_check_view').length,0);
 assert.equal((await events()).filter(e=>e.event==='seller_offer_impression').length,0);
 await block.evaluate(e=>e.style.display='');await block.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>(window.__gtagEvents || window.dataLayer).some(e=>e.event==='part_sherpa_market_check_view'));
 await page.waitForTimeout(250);
 let recorded=await events();const view=recorded.find(e=>e.event==='part_sherpa_market_check_view');
 assert.equal(view.seller_count_total,24);assert.equal(view.new_oem_count,12);assert.equal(view.refurb_used_count,12);assert.equal(view.seller_count_in_stock,20);assert.equal(view.seller_count_backorder,2);assert.equal(view.seller_count_not_available,2);
 const initial=recorded.filter(e=>e.event==='seller_offer_impression');assert(initial.length>0);assert(initial.length<24);
 for(const impression of initial){const visible=await page.locator(`[data-seller-key="${impression.seller_key}"]`).evaluate(e=>{const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();return Math.min(a.bottom,b.bottom,innerHeight)-Math.max(a.top,b.top,0)>=a.height*.5;});assert(visible,'Impressed row must actually be visible');}
 await page.locator('.attempted-group').first().locator('[tabindex="0"]').evaluate(e=>{e.scrollTop=20});await page.waitForTimeout(150);
 assert.equal((await events()).filter(e=>e.event==='part_sherpa_market_check_engaged').length,0);
 await page.locator('.attempted-group').first().locator('[tabindex="0"]').evaluate(e=>{e.scrollTop=180});await page.waitForTimeout(150);
 assert.equal((await events()).filter(e=>e.event==='part_sherpa_market_check_engaged').length,1);
 await page.locator('.attempted-group').last().locator('[tabindex="0"]').evaluate(e=>{e.scrollTop=180});await page.waitForTimeout(150);
 assert.equal((await events()).filter(e=>e.event==='part_sherpa_market_check_engaged').length,1);
 assert((await events()).filter(e=>e.event==='seller_offer_impression').length>initial.length);
 await page.evaluate(()=>{document.addEventListener('click',e=>{const a=e.target.closest('a');if(a?.closest('.sherpa-market-banner')){window.brandBeforeNavigation=(window.brandBeforeNavigation||[]).concat((window.__gtagEvents || window.dataLayer).filter(e=>e.event==='part_sherpa_click').at(-1));e.preventDefault();}})});
 const sellerLink=page.locator('.attempted-group').first().getByRole('link',{name:'View seller'}).nth(2);await sellerLink.scrollIntoViewIfNeeded();
 await page.evaluate(()=>document.addEventListener('click',event=>{if(event.target.closest('.attempted-group a')?.textContent==='View seller ↗')window.sellerBeforeNavigation=(window.__gtagEvents || window.dataLayer).filter(e=>e.event==='seller_outbound_click').at(-1);}));
 const [popup]=await Promise.all([page.waitForEvent('popup'),sellerLink.click()]);await popup.waitForLoadState();await popup.close();
 let clicks=(await events()).filter(e=>e.event==='seller_outbound_click');assert.equal(clicks.length,1);assert.deepEqual(await page.evaluate(()=>window.sellerBeforeNavigation),clicks[0]);assert.equal(clicks[0].destination_domain,'seller.example');assert.equal(clicks[0].click_location,'part_sherpa_market_check');assert.equal(clicks[0].shipping_cost,5);assert.equal(clicks[0].delivered_cost,107);
 const banner=page.locator('.sherpa-market-banner');
 assert.deepEqual(await banner.locator('a').evaluateAll(links=>links.map(a=>({href:a.href,target:a.target}))),[{href:'https://part-sherpa.com/',target:''},{href:'https://part-sherpa.com/',target:''}]);await banner.getByRole('link',{name:'Visit Part Sherpa',exact:true}).click();await banner.getByRole('link',{name:'Visit Part Sherpa →',exact:true}).click();
 let brands=(await events()).filter(e=>e.event==='part_sherpa_click');assert.equal(brands.length,2);assert.deepEqual(brands.map(e=>e.link_type),['logo','text']);assert(brands.every(e=>e.destination_domain==='part-sherpa.com'));assert.equal(await page.evaluate(()=>window.brandBeforeNavigation.length),2);
 const beforeRefresh=await events();await block.getByRole('button',{name:'Refresh',exact:true}).click();await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Refresh'&&!b.disabled));await page.waitForTimeout(250);
 recorded=await events();assert.equal(recorded.filter(e=>e.event==='part_sherpa_market_check_refresh').length,1);assert.equal(recorded.find(e=>e.event==='part_sherpa_market_check_refresh').seller_count_total,24);assert.equal(recorded.filter(e=>e.event==='part_sherpa_market_check_view').length,1);
 const impressions=recorded.filter(e=>e.event==='seller_offer_impression');assert.equal(new Set(impressions.map(e=>e.seller_key)).size,impressions.length);
 for(const event of ['view_item','add_to_cart','begin_checkout','purchase'])assert.deepEqual(recorded.filter(e=>e.event===event),beforeRefresh.filter(e=>e.event===event));
 assert.equal(recorded.filter(e=>e.event==='add_to_cart'||e.event==='begin_checkout'||e.event==='purchase').length,0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 results.push({width,transport,eventCounts:Object.fromEntries([...new Set(recorded.map(e=>e.event))].map(name=>[name,recorded.filter(e=>e.event===name).length])),view,outbound:clicks[0],brandClicks:brands,visibleOnly:true,noDuplicates:true,noOverflow:true});
 await context.close();
}
// Exercise the existing ecommerce helper contracts in a blank browser context.
// No GTM is loaded here, so the synthetic purchase never reaches analytics.
const ts = require('typescript');
const path = require('node:path');
const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/ga4.ts'), 'utf8'), {
 compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
}).outputText;
const ecommercePage = await browser.newPage();
for (const transport of ['dataLayer', 'gtag']) {
 const events = await ecommercePage.evaluate(({compiled,transport}) => {
  window.dataLayer = [];
  const gtagEvents = [];
  window.gtag = transport === 'gtag' ? (command,event,params) => gtagEvents.push({event,...params}) : undefined;
  const helpers = {};
  new Function('exports', compiled)(helpers);
  const product = {mpn:'TEST-MPN',price:40,brand:'Test',condition:'refurbished'};
  const items = [helpers.buildProductItem(product,2)];
  helpers.trackViewItem(product);
  helpers.trackAddToCart(product,2);
  helpers.trackBeginCheckout(items,80);
  helpers.trackPurchase({transactionId:'synthetic-test-only',items,value:80,tax:2,shipping:5});
  return transport === 'gtag' ? gtagEvents : window.dataLayer.filter(event => event.event);
 }, {compiled,transport});
 assert.deepEqual(events.map(event=>event.event),['view_item','add_to_cart','begin_checkout','purchase']);
 assert.deepEqual(events.map(event=>event.value),[40,80,80,80]);
 assert(events.every(event=>event.currency==='USD'&&event.items[0].item_id==='TEST-MPN'&&event.items[0].item_name==='TEST-MPN'&&event.items[0].item_variant==='refurbished'));
 assert.equal(events[1].items[0].quantity,2);
 assert.equal(events[3].transaction_id,'synthetic-test-only');
 assert.equal(events[3].tax,2);assert.equal(events[3].shipping,5);
}
await ecommercePage.close();
await browser.close();if(process.env.RESULTS_FILE) fs.writeFileSync(process.env.RESULTS_FILE,JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({width,transport,eventCounts})=>({width,transport,eventCounts})),null,2));
})().catch(e=>{console.error(e);process.exit(1)});
