import { Suspense } from "react";
import CheckoutClientPage from "./CheckoutClientPage";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-600">
          Loading checkout…
        </div>
      }
    >
      <CheckoutClientPage />
    </Suspense>
  );
}
