import PolicyPage from "@/components/policies/PolicyPage";

export const metadata = {
  title: "Cancellation Policy | Appliance Part Geeks",
  description:
    "Cancellation policy for Appliance Part Geeks orders, including cancellation timing, shipped orders, refunds, and unavailable inventory.",
};

export default function CancellationPage() {
  return (
    <PolicyPage
      eyebrow="Cancellation Policy"
      title="Cancellation Policy"
      intro="Clear information about when an order can be canceled, what happens after shipment, and how refunds are handled."
      summary={[
        "Contact us as soon as possible if you need to cancel an order.",
        "Orders can usually be canceled only before they are processed or shipped.",
        "Orders that have already shipped must be handled through the return process.",
        "Canceled orders are refunded to the original payment method.",
        "Some orders may be canceled by us if inventory is unavailable or order details cannot be verified.",
      ]}
      sections={[
        {
          title: "Need to Cancel Your Order?",
          body: (
            <p>
              Appliance repairs are often time-sensitive, so we process orders quickly.
              If you need to cancel an order, contact us immediately at{" "}
              <a className="underline" href="mailto:support@appliancepartgeeks.com">
                support@appliancepartgeeks.com
              </a>{" "}
              with your order number in the subject line.
            </p>
          ),
        },
        {
          title: "Canceling Before Shipment",
          body: (
            <p>
              Orders canceled before processing or shipment will receive a full refund
              to the original payment method. Because many orders move quickly into
              fulfillment, a cancellation request is not guaranteed until confirmed by
              our support team.
            </p>
          ),
        },
        {
          title: "Orders Already Shipped",
          body: (
            <p>
              Once an order has shipped or a shipping label has been issued, the order
              may no longer be cancelable. After delivery, eligible items may be returned
              in accordance with our return policy.
            </p>
          ),
        },
        {
          title: "Unavailable Inventory or Order Issues",
          body: (
            <>
              <p>
                Appliance Part Geeks may cancel and refund an order if inventory becomes
                unavailable, the item cannot be fulfilled, the shipping address cannot be
                verified, payment cannot be confirmed, or the order appears fraudulent.
              </p>
              <p className="mt-3">
                If an order is canceled by us, we will issue a refund to the original
                payment method.
              </p>
            </>
          ),
        },
        {
          title: "Refund Timing",
          body: (
            <p>
              Approved cancellation refunds are submitted promptly after cancellation is
              confirmed. Bank, card, or payment-provider processing times may vary.
            </p>
          ),
        },
        {
          title: "Questions",
          body: (
            <p>
              For cancellation questions, email{" "}
              <a className="underline" href="mailto:support@appliancepartgeeks.com">
                support@appliancepartgeeks.com
              </a>{" "}
              with your order number and the email address used at checkout.
            </p>
          ),
        },
      ]}
    />
  );
}
