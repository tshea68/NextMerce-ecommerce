export default function ReturnsPage() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold mb-6">Our Return Policy</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Return Eligibility</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Return Window:</strong> Initiate within <strong>30 days</strong> of delivery.</li>
              <li><strong>Condition:</strong> Items must be unused and in original condition with packaging/components.</li>
              <li><strong>RAN Required:</strong> Returns without an approved return authorization may be refused.</li>
            </ul>

            <h3 className="text-lg font-semibold pt-3">Non-Returnable Items</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>“For Parts Only” or “As-Is” items.</li>
              <li>Installed, modified, or damaged items due to improper installation/handling.</li>
              <li>Items missing essential components or original packaging.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">How to Initiate a Return</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Email <strong>returns@appliancepartgeeks.com</strong> with your order number in the subject line.</li>
              <li>Include your full name, order date, reason for return, and photos if applicable.</li>
              <li>Our team will review your request within <strong>3 business days</strong>.</li>
            </ol>

            <h3 className="text-lg font-semibold pt-3">Shipping &amp; Return Process</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>If the return is due to <strong>our error</strong>, we cover return shipping.</li>
              <li>If the return is due to <strong>customer error</strong>, the customer covers return shipping.</li>
              <li>Items must be securely packed and include the issued return authorization.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Refunds &amp; Processing</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Refunds are typically issued within <strong>5–7 business days</strong> after inspection.</li>
              <li>Refunds go back to the original payment method.</li>
              <li>Shipping fees are generally non-refundable unless the return is due to our error.</li>
            </ul>

            <h3 className="text-lg font-semibold pt-3">Right to Refuse</h3>
            <p>Appliance Part Geeks reserves the right to refuse any return that does not meet policy guidelines or appears fraudulent.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
