export default function ShippingPage() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold mb-6">Shipping Policy</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Fast &amp; Reliable Shipping</h2>
            <p>All orders are processed and shipped within <strong>one business day</strong>.</p>
            <p>Orders placed before the daily cutoff may ship the same business day.</p>

            <h3 className="text-lg font-semibold pt-3">Tracking &amp; Delivery</h3>
            <p>Once your order ships, you will receive a tracking number by email.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Shipping Address Accuracy</h2>
            <p>Please double-check your shipping address before submitting payment.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Address Changes:</strong> We generally cannot modify a shipping address after the order is placed.</li>
              <li><strong>Undeliverable Packages:</strong> If an order is returned due to an incorrect address, additional shipping costs may apply.</li>
            </ul>

            <h3 className="text-lg font-semibold pt-3">Shipping Methods</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Domestic:</strong> Standard and expedited options may be available.</li>
              <li><strong>International:</strong> Availability depends on destination and may involve duties/taxes.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">International Customers</h2>
            <p>Additional shipping fees may apply on some international orders.</p>
            <p>The receiver is responsible for duties, tariffs, and taxes.</p>
            <p>We do not undervalue shipments or mark them as gifts.</p>
            <p>If duties or tariffs are refused, the shipment may be disposed of and no refund issued.</p>
            <p className="text-sm italic">By placing an order with Appliance Part Geeks, you agree to these terms.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
