import ProductPageServer from "@/components/ProductPage.server";

type MaybePromise<T> = T | Promise<T>;

export default async function OffersByMpnPage({
  params,
  searchParams,
}: {
  params: MaybePromise<{ mpn: string }>;
  searchParams?: MaybePromise<{ offer?: string }>;
}) {
  const { mpn } = await params;
  const sp = (await searchParams) ?? {};

  return (
    <ProductPageServer
      kind="offers"
      slug={mpn}
      listingId={sp?.offer ?? null}
    />
  );
}