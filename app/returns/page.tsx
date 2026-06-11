import PolicyPage from "@/components/policies/PolicyPage";

export const metadata = {
  title: "Return Policy | Appliance Part Geeks",
  description:
    "Return and refund policy for Appliance Part Geeks orders, including eligible returns, special-order restrictions, return authorization, inspections, damaged items, and refund timing.",
};

export default function ReturnsPage() {
  return (
    <PolicyPage
      eyebrow="Return Policy"
      title="Return Policy"
      intro="Clear information about return eligibility, special-order restrictions, return authorization, inspections, refunds, and what to do if a part arrives damaged or defective."
      summary={[
        "Return requests must be initiated within 30 days of delivery.",
        "A Return Authorization Number is required before sending any item back.",
        "Eligible returns must be unused, uninstalled, unmodified, and in original condition with all included packaging and materials.",
        "Special-order, non-stock, discontinued, NLA, final-sale, installed, modified, or incomplete items may not be returnable.",
        "Electrical and electronic parts may require inspection before refund approval.",
        "Shipping and handling fees are non-refundable unless the return is due to our error.",
      ]}
      sections={[
        {
          title: "Return Eligibility",
          body: (
            <>
              <p>
                Return requests must be initiated within <strong>30 days</strong> of
                delivery. Eligible returned items must be unused, uninstalled,
                unmodified, unopened where applicable, and returned in original
                condition with all packaging, labels, accessories, instructions, and
                components included.
              </p>
              <p className="mt-3">
                A Return Authorization Number must be obtained before returning any
                item. Returns sent without an approved authorization may be refused.
              </p>
            </>
          ),
        },
        {
          title: "New Supplier Parts and Special-Order Items",
          body: (
            <>
              <p>
                Some new appliance parts are sourced through supplier inventory and may
                be special-order or non-stock items. Special-order and non-stock parts
                may not be returnable once ordered, even if the item has not yet been
                installed.
              </p>
              <p className="mt-3">
                Please confirm the full manufacturer part number, appliance model
                number, and part appearance before ordering. If a product page shows a
                special-order status, return restrictions may apply.
              </p>
            </>
          ),
        },
        {
          title: "Refurbished, Used, and Electronic Parts",
          body: (
            <>
              <p>
                Appliance Part Geeks sells both new and refurbished/used OEM appliance
                parts. Product condition is shown before purchase.
              </p>
              <p className="mt-3">
                Refurbished and used parts must be returned in the same condition
                received, with all included materials. Electrical and electronic parts,
                including control boards, user interfaces, sensors, switches, and
                similar components, may require inspection before a refund is approved.
              </p>
              <p className="mt-3">
                Installed, connected, altered, damaged, mishandled, or modified
                electrical parts may not be eligible for return or refund.
              </p>
            </>
          ),
        },
        {
          title: "Non-Returnable Items",
          body: (
            <ul className="list-disc space-y-1 pl-5">
              <li>Special-order or non-stock supplier parts.</li>
              <li>Parts marked discontinued, no longer available, NLA, final sale, “For Parts Only,” or “As-Is.”</li>
              <li>
                Installed, connected, modified, damaged, or incomplete items, unless
                the return is approved as a defect or shipping-damage claim.
              </li>
              <li>
                Items damaged by improper installation, incorrect wiring, misuse,
                mishandling, or attempted repair.
              </li>
              <li>
                Items missing essential components, labels, packaging, manuals,
                accessories, or identifying information.
              </li>
              <li>Items returned without an approved Return Authorization Number.</li>
            </ul>
          ),
        },
        {
          title: "Compatibility and Ordering Mistakes",
          body: (
            <>
              <p>
                Customers are responsible for confirming that the part number,
                appliance model number, and part appearance match the part needed for
                the repair before ordering.
              </p>
              <p className="mt-3">
                Appliance parts with similar numbers or similar appearance may not be
                interchangeable. We provide part numbers, model information, images,
                titles, and compatibility information to help customers choose the
                correct item, but appliance manufacturers may use multiple revisions or
                replacement part numbers.
              </p>
            </>
          ),
        },
        {
          title: "How to Start a Return",
          body: (
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Email{" "}
                <a className="underline" href="mailto:returns@appliancepartgeeks.com">
                  returns@appliancepartgeeks.com
                </a>{" "}
                with your order number in the subject line.
              </li>
              <li>
                Include your full name, order date, part number, reason for return,
                and photos if applicable.
              </li>
              <li>
                Our team will review your request and provide return instructions if
                the return is approved.
              </li>
            </ol>
          ),
        },
        {
          title: "Damaged, Shorted, or Incorrect Shipments",
          body: (
            <>
              <p>
                If an item arrives damaged, appears defective, is missing parts, or the
                shipment does not match the order, contact us within{" "}
                <strong>5 days</strong> of delivery with your order number, a
                description of the issue, and clear photos of the item and packaging.
              </p>
              <p className="mt-3">
                We may request additional information to verify the issue and determine
                whether replacement, return, refund, warranty assistance, or another
                resolution is appropriate.
              </p>
            </>
          ),
        },
        {
          title: "Return Shipping",
          body: (
            <ul className="list-disc space-y-1 pl-5">
              <li>
                If our error caused the issue, we will cover approved return shipping.
              </li>
              <li>
                If the return is due to customer error, compatibility mistake, changed
                mind, or incorrect address, the customer is responsible for return
                shipping.
              </li>
              <li>
                Returned items must be securely packed to prevent transit damage and
                must include the issued Return Authorization Number.
              </li>
              <li>
                Original shipping and handling fees are non-refundable unless the
                return is due to our error.
              </li>
            </ul>
          ),
        },
        {
          title: "Refunds and Processing",
          body: (
            <>
              <p>
                Refunds are issued after the returned item is received and inspected.
                Approved refunds are credited to the original payment method.
              </p>
              <p className="mt-3">
                Refund processing typically takes <strong>5–7 business days</strong>{" "}
                after inspection, though bank or payment-card processing times may vary.
                Refunds are processed based on the original purchase price paid for the
                item.
              </p>
            </>
          ),
        },
        {
          title: "Warranty and Defective Parts",
          body: (
            <>
              <p>
                Some new parts may be covered by a manufacturer warranty. Warranty
                coverage, timing, required documentation, and available remedies are
                controlled by the applicable manufacturer or supplier terms.
              </p>
              <p className="mt-3">
                Warranty claims may require the part, model number, serial number,
                photos, testing information, or other documentation. Warranty handling
                may involve credit, replacement, reorder, inspection, or other supplier
                process depending on the item.
              </p>
            </>
          ),
        },
        {
          title: "Right to Refuse Returns",
          body: (
            <p>
              Appliance Part Geeks reserves the right to refuse returns that do not
              meet this policy, are missing required authorization, appear fraudulent,
              involve special-order or non-returnable items, or involve items returned
              in a different condition than originally sold.
            </p>
          ),
        },
      ]}
    />
  );
}
