import type { Metadata } from "next";
import ProductPageServer from "@/components/ProductPage.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Part layout preview | NextMerce",
  robots: { index: false, follow: false },
};

// Keep the shared live product layout as a noindex regression reference.
export default function TestPartPage() {
  return <ProductPageServer kind="offers" slug="WP8546219" />;
}
