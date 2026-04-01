export default function TermsPage() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold mb-6">Terms Of Service</h1>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">Introduction</h2>
          <p>
            Welcome to <strong>Appliance Part Geeks</strong>. These Terms of
            Service govern your access to and use of our website, products, and
            services.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">Orders &amp; Payments</h2>
          <p>
            All orders are subject to acceptance and availability. Orders are
            processed securely through <strong>PayPal</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Accepted Payments:</strong> PayPal, including cards and linked bank accounts.</li>
            <li><strong>Taxes &amp; Duties:</strong> Sales tax and international duties may apply.</li>
          </ul>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">Shipping &amp; Returns</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Shipping:</strong> Orders are typically processed within 1 business day.</li>
            <li><strong>Returns:</strong> 30-day return policy on eligible items.</li>
            <li><strong>Refunds:</strong> Issued after returned items are inspected.</li>
          </ul>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">Liability Disclaimer</h2>
          <p>
            Appliance Part Geeks is not responsible for damages, losses, or
            liabilities beyond the purchase price of the part. Customers are
            responsible for compatibility, installation, and following
            manufacturer guidelines.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">Privacy &amp; Data Collection</h2>
          <p>
            Our website collects user data as outlined in our Privacy Policy,
            including cookie/tracking and payment-security practices.
          </p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">GDPR Compliance (For European Visitors)</h2>
          <p>If you are a resident of the EEA, you may have rights to access, rectify, erase, restrict, or object to how your personal data is used.</p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">Changes to Terms</h2>
          <p>We reserve the right to update these Terms at any time.</p>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-semibold">Contact Us</h2>
          <p><strong>Email:</strong> derek@appliancepartgeeks.com</p>
          <p><strong>Address:</strong> 6101 Blair Rd NW Suite C, Washington, DC</p>
          <p><strong>Phone:</strong> (202)-882-1699</p>
        </section>
      </div>
    </div>
  );
}
