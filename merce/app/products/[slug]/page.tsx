import { redirect } from "next/navigation";

const DEMO_SLUGS = new Set([
  "applewatch",
  "fitness",
  "gamepad",
  "grinder",
  "imac",
  "ipad",
  "iphone14",
  "iphone16promax",
  "macbook",
  "television",
]);

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = (params.slug || "").toLowerCase();

  if (DEMO_SLUGS.has(slug)) {
    redirect(`/demo_product/${slug}`);
  }

  redirect(`/shop?search=${encodeURIComponent(slug)}`);
}
