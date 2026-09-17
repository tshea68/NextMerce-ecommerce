import type { Metadata } from "next";
import ProductPageServer from "@/components/ProductPage.server";
import "./preview.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Part layout preview | NextMerce",
  robots: { index: false, follow: false },
};

// Preview the existing offers redesign without changing either product route.
export default function TestPartPage() {
  return (
    <div className="nextmerce-part-preview">
      <ProductPageServer kind="offers" slug="WP8546219" previewLayout />
    </div>
  );
}
