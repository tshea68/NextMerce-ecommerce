import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { CartProvider } from "@/context/CartContext";
import GTMPageView from "@/components/GTMPageView";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.appliancepartgeeks.com"),
  title: "Appliance Part Geeks | OEM Appliance Parts & Refurbished Parts",
  description:
    "Shop new OEM and refurbished appliance parts by model number, part number, brand, appliance type, or part type.",
  alternates: {
    canonical: "/",
  },
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#001f3e] text-white">
        {GTM_ID ? (
          <>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              />
            </noscript>

            <Script id="gtm-script" strategy="afterInteractive">
              {`
                (function(w,d,s,l,i){
                  w[l]=w[l]||[];
                  w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
                  var f=d.getElementsByTagName(s)[0],
                      j=d.createElement(s),
                      dl=l!='dataLayer' ? '&l=' + l : '';
                  j.async=true;
                  j.src='https://www.googletagmanager.com/gtm.js?id=' + i + dl;
                  f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${GTM_ID}');
              `}
            </Script>

            <GTMPageView />
          </>
        ) : null}

        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}