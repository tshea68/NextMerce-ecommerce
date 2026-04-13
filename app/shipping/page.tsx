import InfoPageLayout from "@/components/site/InfoPageLayout";
import SectionBar from "@/components/site/SectionBar";

export default function ShippingPage() {
  return (
    <InfoPageLayout title="Shipping Policy">
      <div className="space-y-4 text-sm leading-7 text-black/75">
        <SectionBar>Fast &amp; Reliable Shipping</SectionBar>
        <p>
          At <strong>Appliance Part Geeks</strong>, we prioritize fast and efficient
          shipping to ensure you receive your order as quickly as possible. All
          orders are processed and shipped within <strong>one business day</strong>.
        </p>
        <p>
          Orders placed before our daily shipping cutoff time will be shipped the{" "}
          <strong>same business day</strong>. Orders placed after the cutoff time
          will be shipped the <strong>next business day</strong>.
        </p>

        <SectionBar>Tracking &amp; Delivery</SectionBar>
        <p>
          Once your order has shipped, you will receive a tracking number via
          email. Delivery times vary based on the shipping method selected at
          checkout.
        </p>

        <SectionBar>Shipping Address Accuracy</SectionBar>
        <p>
          Please double-check your shipping address before submitting payment.
          We can only ship to the address provided at checkout.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Address Changes:</strong> Once an order has been placed, we
            are unable to modify the shipping address.
          </li>
          <li>
            <strong>Undeliverable Packages:</strong> If an order is returned due
            to an incorrect or incomplete address, the buyer will be responsible
            for any additional shipping costs.
          </li>
        </ul>

        <SectionBar>Shipping Carriers &amp; Methods</SectionBar>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Domestic Shipping:</strong> Standard and expedited shipping
            options are available at checkout.
          </li>
          <li>
            <strong>International Shipping:</strong> Availability depends on the
            destination country. Additional customs duties or taxes may apply.
          </li>
        </ul>

        <SectionBar>Lost or Delayed Shipments</SectionBar>
        <p>
          If your package is delayed or lost in transit, please contact the carrier
          first using your tracking number. If further assistance is needed, email{" "}
          <a className="underline" href="mailto:support@appliancepartgeeks.com">
            support@appliancepartgeeks.com
          </a>
          .
        </p>

        <SectionBar>International Customers – Please Read</SectionBar>
        <p>
          <strong>Effective: March 18, 2025</strong>
        </p>
        <p>
          This policy applies only to international orders—any orders shipped
          outside the United States, including Canada, Mexico, and other countries.
        </p>

        <SectionBar>Shipping Costs</SectionBar>
        <p>
          Some international orders may require additional shipping fees. If
          additional fees apply, we will contact you. If we do not receive a
          response within 2 days, the order may be canceled and refunded.
        </p>

        <SectionBar>Customs &amp; Duties</SectionBar>
        <p>
          The receiver is responsible for all duties, tariffs, and taxes. We do not
          collect these at checkout. We will never undervalue a shipment or mark it
          as a gift.
        </p>

        <SectionBar>Refused Deliveries &amp; No Refunds</SectionBar>
        <p>
          If duties or tariffs are refused, we will instruct the carrier to dispose
          of the shipment. No refund will be issued.
        </p>

        <SectionBar>Delivery Times &amp; Customs Delays</SectionBar>
        <p>
          International shipping times vary; customs clearance may cause delays
          beyond our control.
        </p>

        <SectionBar>Order Feasibility</SectionBar>
        <p>
          For low-value items with disproportionately high shipping, we may reach
          out to discuss options before proceeding.
        </p>

        <p className="italic text-xs">
          By placing an order with Appliance Part Geeks, you agree to these terms.
        </p>
      </div>
    </InfoPageLayout>
  );
}
