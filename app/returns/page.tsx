import PolicyPage from "@/components/policies/PolicyPage";

export const metadata = {
  title: "Return Policy | Appliance Part Geeks",
  description:
    "Return and refund policy for Appliance Part Geeks orders, including return eligibility, authorization, inspections, defective items, and refund timing.",
};

export default function ReturnsPage() {
  return (
    <PolicyPage
      eyebrow="Return Policy"
      title="Return Policy"
      intro="Clear information about return eligibility, return authorization, inspections, refunds, and what to do if a part arrives damaged or defective."
      summary={[
        "Return requests must be initiated within 30 days of delivery.",
        "A Return Authorization Number is required before sending any item back.",
        "Returned items must be unused, unmodified, and in original condition unless the return is for an approved defect claim.",
        "Installed electrical or electronic parts may require inspection before refund approval.",
        "Refunds are issued to the original payment method after the returned item is received and inspected.",
        "Shipping fees are non-refundable unless the return is due to our error.",
      ]}
      sections={[
        {
          title: "Return Eligibility",
          body: (
            <>
              <p>
                Return requests must be initiated within <strong>30 days</strong> of
                delivery. Items must be unused, unmodified, and returned in original
                condition with all packaging, labels, accessories, and components
                included.
              </p>
              <p className="mt-3">
                A Return Authorization Number must be obtained before returning any
                item. Returns sent without an approved authorization may be refused.
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
                Electrical and electronic parts, including control boards, user
                interfaces, sensors, switches, and similar components, may require
                inspection before a refund is approved, especially if the item has been
                installed, connected, altered, or handled in a way that could affect its
                condition.
              </p>
            </>
          ),
        },
        {
          title: "Non-Returnable Items",
          body: (
            <ul className="list-disc space-y-1 pl-5">
              <li>Items listed as “For Parts Only,” “As-Is,” or final sale.</li>
              <li>
                Installed, modified, damaged, or incomplete items, unless the return is
                approved as a defect or damage claim.
              </li>
              <li>
                Items damaged by improper installation, incorrect wiring, misuse,
                mishandling, or attempted repair.
              </li>
              <li>
                Items missing essential components, labels, packaging, or identifying
                information.
              </li>
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
                We provide part numbers, model information, images, titles, and
                compatibility information to help customers choose the correct item, but
                appliance manufacturers may use multiple part revisions or replacement
                part numbers. Contact us before ordering if you are unsure.
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
                Include your full name, order date, reason for return, and photos if
                applicable.
              </li>
              <li>
                Our team will review your request and provide return instructions if
                the return is approved.
              </li>
            </ol>
          ),
        },
        {
          title: "Damaged or Defective Items",
          body: (
            <>
              <p>
                If an item arrives damaged or appears defective, contact us promptly
                with your order number, a description of the issue, and clear photos of
                the item and packaging.
              </p>
              <p className="mt-3">
                We may request additional information to verify the issue and determine
                whether replacement, return, refund, or other resolution is appropriate.
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
                Original shipping fees are non-refundable unless the return is due to
                our error.
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
              or involve items returned in a different condition than originally sold.
            </p>
          ),
        },
      ]}
    />
  );
}
