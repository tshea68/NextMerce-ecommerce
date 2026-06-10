import Link from "next/link";
import PolicyPage from "@/components/policies/PolicyPage";

export const metadata = {
  title: "Terms of Service | Appliance Part Geeks",
  description:
    "Terms of Service for Appliance Part Geeks, including orders, payments, product condition, compatibility, shipping, returns, and liability.",
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Terms of Service"
      title="Terms of Service"
      intro="These terms govern your use of Appliance Part Geeks, including product listings, orders, payments, shipping, returns, compatibility, and limitations of liability."
      summary={[
        "Orders are subject to acceptance, payment verification, and inventory availability.",
        "Appliance Part Geeks sells new, refurbished, and used OEM appliance replacement parts.",
        "Customers are responsible for confirming part number and appliance compatibility before ordering.",
        "Shipping, returns, and cancellations are governed by the policies linked on this site.",
        "Manufacturer names and part numbers are used only for identification and compatibility.",
        "Our liability is limited to the purchase price of the part sold.",
      ]}
      sections={[
        {
          title: "Introduction",
          body: (
            <>
              <p>
                Welcome to <strong>Appliance Part Geeks</strong>. These Terms of
                Service govern your access to and use of our website, products, and
                services.
              </p>
              <p className="mt-3">
                By using this website or placing an order, you agree to these terms.
                If you do not agree, please do not use the website or purchase from
                Appliance Part Geeks.
              </p>
            </>
          ),
        },
        {
          title: "Products and Product Condition",
          body: (
            <>
              <p>
                Appliance Part Geeks sells appliance replacement parts, including new
                OEM parts, refurbished OEM parts, used OEM parts, and other replacement
                parts where clearly identified.
              </p>
              <p className="mt-3">
                Product condition is shown on the product page before purchase. A
                refurbished or used OEM part is not a new manufacturer-packaged part.
                Customers should review the product title, condition, images, price,
                availability, and description before ordering.
              </p>
            </>
          ),
        },
        {
          title: "Compatibility and Part Identification",
          body: (
            <>
              <p>
                Customers are responsible for verifying that the part number, appliance
                model number, product image, and part appearance match the part needed
                for the repair.
              </p>
              <p className="mt-3">
                Compatibility information, replacement numbers, model references, and
                part descriptions are provided to help customers identify parts, but
                appliance manufacturers may use multiple revisions, substitutions, or
                replacement part numbers. Contact us before ordering if you are unsure.
              </p>
            </>
          ),
        },
        {
          title: "Orders and Payments",
          body: (
            <>
              <p>
                All orders are subject to acceptance, payment verification, fraud
                review, inventory availability, and fulfillment feasibility. We reserve
                the right to refuse, cancel, or refund any order at our discretion.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>
                  <strong>Payment processing:</strong> payments are processed through
                  secure third-party payment providers. We do not store full payment
                  card details.
                </li>
                <li>
                  <strong>Taxes and duties:</strong> sales tax, if applicable, is
                  calculated at checkout. International orders may be subject to duties,
                  taxes, brokerage fees, customs charges, or import requirements, which
                  are the customer's responsibility.
                </li>
                <li>
                  <strong>Pricing or inventory errors:</strong> if a product is listed
                  with an incorrect price, incorrect availability, or other error, we may
                  cancel and refund the order.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Shipping, Returns, and Cancellations",
          body: (
            <>
              <p>
                Shipping options, estimated delivery dates, and shipping costs are shown
                at checkout when available. Processing and delivery times may vary based
                on item location, inventory status, carrier availability, destination,
                order time, and selected shipping method.
              </p>
              <p className="mt-3">
                Returns, refunds, and cancellations are governed by our published
                policies:
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>
                  <Link className="underline" href="/shipping">
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link className="underline" href="/returns">
                    Return Policy
                  </Link>
                </li>
                <li>
                  <Link className="underline" href="/cancel">
                    Cancellation Policy
                  </Link>
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Electrical Parts and Installation Risk",
          body: (
            <p>
              Many appliance parts, including control boards, user interfaces, sensors,
              switches, motors, and other electrical components, should be installed
              only by a qualified person or by someone comfortable with appliance repair.
              Customers are responsible for safe installation, disconnecting power before
              service, following manufacturer guidance, and confirming the part is
              appropriate for the appliance.
            </p>
          ),
        },
        {
          title: "Limitation of Liability",
          body: (
            <>
              <p>
                Appliance Part Geeks is not responsible for damages, losses, or
                liabilities beyond the purchase price of the part sold.
              </p>
              <p className="mt-3">
                We do not cover labor, installation fees, diagnostic fees, appliance
                damage, food loss, lost time, incidental costs, consequential damages,
                financial losses, personal injury, property damage, or other losses
                resulting from installation, use, failure, incompatibility, power surge,
                improper handling, or incorrect installation of a part.
              </p>
            </>
          ),
        },
        {
          title: "Independent Seller Disclosure",
          body: (
            <p>
              Manufacturer names, brand names, model numbers, and part numbers are used
              only for identification and compatibility. Appliance Part Geeks is an
              independent seller and is not affiliated with, sponsored by, or endorsed by
              the listed appliance manufacturers.
            </p>
          ),
        },
        {
          title: "Third-Party Links and Services",
          body: (
            <p>
              Our website may contain links to third-party websites, carriers, payment
              providers, or services. We are not responsible for third-party content,
              policies, actions, systems, delays, or errors.
            </p>
          ),
        },
        {
          title: "Privacy and Data",
          body: (
            <p>
              Our website collects and processes information as described in our{" "}
              <Link className="underline" href="/privacy">
                Privacy Policy
              </Link>
              . Payment information is processed by secure third-party payment
              providers, and we do not store full payment card details.
            </p>
          ),
        },
        {
          title: "Changes to These Terms",
          body: (
            <p>
              We may update these Terms of Service at any time. Updates are effective
              when posted on this website. Continued use of the site after changes are
              posted means you accept the updated terms.
            </p>
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              For questions about these terms, contact Appliance Part Geeks at{" "}
              <a className="underline" href="mailto:support@appliancepartgeeks.com">
                support@appliancepartgeeks.com
              </a>
              , call{" "}
              <a className="underline" href="tel:2028821699">
                202-882-1699
              </a>
              , or write to 6101 Blair Rd NW Suite C, Washington, DC 20011.
            </p>
          ),
        },
      ]}
    />
  );
}
