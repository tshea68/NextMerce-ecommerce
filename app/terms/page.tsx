import InfoPageLayout from "@/components/site/InfoPageLayout";

export default function TermsPage() {
  return (
    <InfoPageLayout title="Terms Of Service">
      <section className="space-y-3 mb-8">
        <h2>Introduction</h2>
        <p>
          Welcome to <strong>Appliance Part Geeks</strong>. These Terms of
          Service ("Terms") govern your access to and use of our
          website, products, and services. By using our website, you agree to
          comply with these Terms. If you do not agree, please do not use our
          website.
        </p>
      </section>

      <section className="space-y-3 mb-8">
        <h2>Orders & Payments</h2>
        <p>
          All orders placed on <strong>Appliance Part Geeks</strong> are
          subject to acceptance and availability. We reserve the right to
          refuse or cancel any order at our discretion. Orders are processed
          securely through <strong>PayPal</strong>, and we do not store
          payment details for customer security.
        </p>
        <ul>
          <li>
            <strong>Accepted Payments:</strong> We accept PayPal, which allows
            payments via credit cards, debit cards, and linked bank accounts.
          </li>
          <li>
            <strong>Taxes & Duties:</strong> Sales tax, if applicable,
            will be calculated at checkout. International orders may be
            subject to duties, taxes, or customs fees, which are the
            customer's responsibility.
          </li>
        </ul>
        <p>
          <strong>
            By placing an order, you agree to these terms and authorize
            Appliance Part Geeks to process your payment accordingly.
          </strong>
        </p>
      </section>

      <section className="space-y-3 mb-8">
        <h2>Shipping & Returns</h2>
        <ul>
          <li>
            <strong>Shipping:</strong> Orders are typically processed within 1
            business day. Delivery times depend on the shipping provider.
          </li>
          <li>
            <strong>Returns:</strong> We offer a{" "}
            <strong>30-day return policy</strong>. Items must be in original
            condition and returned with proof of purchase.
          </li>
          <li>
            <strong>Refunds:</strong> Refunds are issued after returned items
            are inspected.
          </li>
        </ul>
      </section>

      <section className="space-y-3 mb-8">
        <h2>Liability Disclaimer</h2>
        <p>
          <strong>Appliance Part Geeks</strong> provides parts for appliances,
          but we are not responsible for how they are used. By purchasing
          from us, you agree that:
        </p>
        <p>
          Appliance Part Geeks is not responsible for any damages, losses, or
          liabilities beyond the purchase price of the part. We do not cover
          labor, installation fees, appliance damage, incidental costs, or
          financial losses resulting from the use or failure of a part.
          Customers are solely responsible for verifying compatibility,
          ensuring proper installation, and following manufacturer guidelines.
          We assume no liability for power surges, incorrect installation,
          property damage, personal injury, or appliance malfunctions caused
          by the part's use. Returns must comply with our Return
          Authorization (RA) process within 30 days.
        </p>
        <ul>
          <li>
            <strong>Installation Risks:</strong> We are not liable for damage
            or injury resulting from improper installation or use.
          </li>
          <li>
            <strong>Third-Party Links:</strong> Our website may contain links
            to external sites. We are not responsible for their content or
            policies.
          </li>
        </ul>
      </section>

      <section className="space-y-3 mb-8">
        <h2>Privacy & Data Collection</h2>
        <p>
          Our website collects user data as outlined in our Privacy Policy.
        </p>
        <ul>
          <li>
            <strong>Cookies & Tracking:</strong> We use Google Analytics to monitor website traffic.
          </li>
          <li>
            <strong>Payment Security:</strong> All transactions are processed via PayPal. We do not store payment data.
          </li>
          <li>
            <strong>Marketing Preferences:</strong> Users can opt out of marketing communications at any time.
          </li>
        </ul>
      </section>

      <section className="space-y-3 mb-8">
        <h2>GDPR Compliance</h2>
        <p>
          If you are a resident of the European Economic Area (EEA), you have rights under GDPR.
        </p>
        <ul>
          <li><strong>Access</strong> – Request your data</li>
          <li><strong>Rectification</strong> – Fix inaccurate data</li>
          <li><strong>Erasure</strong> – Delete your data</li>
          <li><strong>Restrict Processing</strong></li>
          <li><strong>Object</strong> – Opt out of marketing</li>
        </ul>
        <p>
          Contact us at <a href="mailto:derek@appliancepartgeeks.com">derek@appliancepartgeeks.com</a>
        </p>
      </section>

      <section className="space-y-3 mb-8">
        <h2>Changes to Terms</h2>
        <p>
          We may update these Terms at any time.
        </p>
      </section>

      <section className="space-y-3 mb-8">
        <h2>Contact</h2>
        <p>
          <strong>Email:</strong> derek@appliancepartgeeks.com<br/>
          <strong>Address:</strong> 6101 Blair Rd NW Suite C, Washington, DC<br/>
          <strong>Phone:</strong> (202)-882-1699
        </p>
      </section>
    </InfoPageLayout>
  );
}
