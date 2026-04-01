import Link from "next/link";

export default function OrderLookupStubPage() {
  return (
    <div className="mx-auto w-[92%] max-w-[900px] py-16 text-white">
      <h1 className="text-3xl font-semibold">Track Order</h1>
      <p className="mt-4 text-white/75">
        Order lookup by public token is handled on the order status route.
      </p>
      <p className="mt-6">Use your tracking link, or go to an order URL like:</p>
      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/85">
        /order/your-public-token
      </div>
      <div className="mt-6">
        <Link href="/" className="underline underline-offset-4">
          Return home
        </Link>
      </div>
    </div>
  );
}
