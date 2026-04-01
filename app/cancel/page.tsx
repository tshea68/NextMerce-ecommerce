export default function CancelPage() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold mb-6">Cancellation Policy</h1>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Need to Cancel Your Order?</h2>
          <p>
            Appliance repairs are time-sensitive, and we prioritize fast order
            processing. If you need to cancel your order, contact us as quickly
            as possible at <strong>support@appliancepartgeeks.com</strong>.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Can I Cancel Before It Ships?</h2>
          <p>
            Yes. Orders canceled before shipment should receive a{" "}
            <strong>full refund</strong>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">What If My Order Has Already Shipped?</h2>
          <p>
            If you received a shipping confirmation email, your order is already
            on its way and cannot be canceled. Once it arrives, you may return
            it in accordance with the return policy.
          </p>
        </section>
      </div>
    </div>
  );
}
