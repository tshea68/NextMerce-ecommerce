import type { Metadata } from "next";
import ProductPageServer from "@/components/ProductPage.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Part layout preview | NextMerce",
  robots: { index: false, follow: false },
};

// Preview the existing offers redesign without changing either product route.
export default function TestPartPage() {
  return <ProductPageServer kind="offers" slug="WP8546219" />;
}
