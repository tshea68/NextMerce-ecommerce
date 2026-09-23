"""Run against a local Next server: APG_TEST_URL=http://localhost:3011 python tests/apg-search.browser.py.
Real Chromium/React tests; only API responses are controlled. No production writes.
"""
import asyncio,json,os,time
from urllib.parse import urlsplit,parse_qs
from playwright.async_api import async_playwright

BASE=os.getenv('APG_TEST_URL','http://localhost:3011')
async def run():
 async with async_playwright() as p:
  browser=await p.chromium.launch(args=['--no-sandbox'])
  results=[]
  for case in ['part','model','numeric','external','unverified','cancel','local-error']:
   page=await browser.new_page(viewport={'width':1440,'height':1000}); requests=[];errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   query={'part':'WR55X11202','model':'79641722010','numeric':'5304529759'}.get(case,'ZZ123456')
   async def api(route):
    path=urlsplit(route.request.url).path;q=parse_qs(urlsplit(route.request.url).query).get('q',[''])[0]
    requests.append(path)
    if path=='/api/search-identity':
     if case=='local-error':return await route.fulfill(status=503,json={'detail':'Unavailable'})
     if case in ['external','unverified','cancel'] and q!='W10750487':data={'status':'miss'}
     else:data={'status':'found','identity':{'kind':'model' if case=='model' else 'part','identifier':q,'title':'Verified control board','brand':'GE','appliance_type':'Refrigerator','part_type':'Circuit Board','source':'local_catalog'}}
     await asyncio.sleep(.05)
    elif path=='/api/search-identity/external':
     await asyncio.sleep(1)
     data={'status':'unverified'} if case=='unverified' else {'status':'found','identity':{'kind':'part','identifier':q,'title':'Verified control board','brand':'GE','source':'verified_external','source_url':'https://www.repairclinic.com/PartDetail/123'}}
    elif path.startswith('/api/suggest'):
     await asyncio.sleep(3)
     data=[]
    else:data=[]
    try:await route.fulfill(json=data)
    except Exception:pass # superseded requests can be aborted by React cleanup
   await page.route('**/api/**',api)
   await page.goto(BASE,wait_until='domcontentloaded')
   await page.wait_for_function("() => [...document.querySelectorAll('button')].some(e => e.textContent.includes('Search by model number') && Object.keys(e).some(k => k.startsWith('__reactProps$') && typeof e[k]?.onClick === 'function'))")
   await page.get_by_role('button',name='Search by model number, part number (MPN), brand, or appliance type Search',exact=True).click()
   field=page.get_by_placeholder('Search by model number, part number (MPN), brand, or appliance type',exact=True)
   started=time.perf_counter();await field.fill(query)
   if case in ['part','model','numeric']:
    await page.locator('div.group').filter(has_text=query).first.wait_for(state='visible',timeout=1800)
    elapsed=(time.perf_counter()-started)*1000
    assert '/api/search-identity/external' not in requests
    if case=='model':assert await page.get_by_role('link',name='Search with Part Sherpa →').count()==0
   elif case in ['external','unverified','cancel']:
    await page.get_by_text('Searching the internet… hang tight.',exact=True).wait_for()
    if case=='cancel':
     await field.fill('W10750487')
     await page.locator('div.group').filter(has_text='W10750487').first.wait_for()
     await page.wait_for_timeout(1800)
     assert await page.locator('div.group').filter(has_text='ZZ123456').count()==0
     assert '/api/search-identity/external' not in requests
    elif case=='external':
     await page.locator('div.group').filter(has_text=query).first.wait_for()
     assert await page.get_by_role('link',name='View verified source').is_visible()
    else:
     await page.get_by_text('We couldn’t verify that number.',exact=True).wait_for()
     assert await page.get_by_text('Check the label and try again.',exact=True).is_visible()
    elapsed=(time.perf_counter()-started)*1000
   else:
    await page.get_by_text('Search is temporarily unavailable. Please try again.',exact=True).wait_for()
    assert '/api/search-identity/external' not in requests
    elapsed=(time.perf_counter()-started)*1000
   assert not any('parts-agent' in x or 'openai' in x for x in requests)
   assert not errors,errors
   results.append({'case':case,'ms':round(elapsed,1),'passed':True})
   print(json.dumps(results[-1]),flush=True);await page.close()
  await browser.close()
 print(f'{len(results)} browser regressions passed')
asyncio.run(run())
