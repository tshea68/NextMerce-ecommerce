import PolicyPage from "@/components/policies/PolicyPage";

export const metadata = {
  title: "Shipping Policy | Appliance Part Geeks",
  description:
    "Shipping policy for Appliance Part Geeks orders, including processing times, tracking, expedited shipping, pickup, and international shipping.",
};

export default function ShippingPage() {
  return (
    <PolicyPage
      eyebrow="Shipping Policy"
      title="Shipping Policy"
      intro="Clear, simple information about order processing, tracking, delivery options, distribution center pickup, and international shipments."
      updated="March 18, 2025"
      summary={[
        "Orders usually ship the same business day or next business day.",
        "Tracking is emailed after shipment.",
        "Shipping options and costs are shown at checkout.",
        "Expedited or overnight shipping may be available for eligible in-stock parts.",
        "Some items may ship from different supplier or distribution locations.",
        "In-person pickup may be available at select distribution centers.",
      ]}
      sections={[
        {
          title: "Order Processing",
          body: (
            <>
              <p>
                Orders placed before our daily shipping cutoff are typically processed
                and shipped the same business day. Orders placed after the cutoff are
                typically processed the next business day.
              </p>
              <p className="mt-3">
                Processing times may vary for items that require supplier confirmation,
                transfer between locations, special handling, or additional fraud review.
              </p>
            </>
          ),
        },
        {
          title: "Shipping Methods and Costs",
          body: (
            <>
              <p>
                Standard and expedited shipping options are available for many domestic
                orders. Available methods, estimated delivery dates, and shipping costs
                are shown at checkout before payment.
              </p>
              <p className="mt-3">
                Expedited and overnight shipping are not available for every item or
                destination. Availability depends on inventory location, order time,
                carrier availability, destination, and selected shipping method.
              </p>
            </>
          ),
        },
        {
          title: "Tracking and Delivery",
          body: (
            <p>
              Once your order has shipped, tracking information will be sent to the
              email address used at checkout. Delivery times vary based on the carrier,
              destination, and shipping method selected.
            </p>
          ),
        },
        {
          title: "Shipping Address Accuracy",
          body: (
            <>
              <p>
                Please double-check your shipping address before submitting payment.
                We can only ship to the address provided at checkout.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>
                  <strong>Address changes:</strong> once an order has been placed, we
                  may be unable to modify the shipping address.
                </li>
                <li>
                  <strong>Undeliverable packages:</strong> if an order is returned due
                  to an incorrect or incomplete address, the buyer may be responsible
                  for additional shipping costs.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Distribution Center Pickup",
          body: (
            <p>
              In-person pickup may be available at select distribution centers for
              eligible orders. Pickup availability depends on item location, order
              status, and local handling requirements. Contact us before visiting a
              pickup location.
            </p>
          ),
        },
        {
          title: "Lost, Delayed, or Damaged Shipments",
          body: (
            <>
              <p>
                If your package is delayed or appears lost in transit, please first
                check the carrier tracking details. If further assistance is needed,
                contact us with your order number and tracking number.
              </p>
              <p className="mt-3">
                If an item arrives damaged, contact us promptly with your order number,
                photos of the packaging, and photos of the damaged item so we can review
                the issue.
              </p>
            </>
          ),
        },
        {
          title: "International Orders",
          body: (
            <>
              <p>
                International shipping availability depends on the destination country,
                carrier service, item type, and order value. Additional shipping fees may
                apply to some international orders.
              </p>
              <p className="mt-3">
                The receiver is responsible for customs duties, tariffs, taxes, brokerage
                fees, and import requirements. We do not undervalue shipments or mark
                orders as gifts.
              </p>
              <p className="mt-3">
                If duties, taxes, or delivery charges are refused and the carrier
                abandons or disposes of the shipment, no refund may be available.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
