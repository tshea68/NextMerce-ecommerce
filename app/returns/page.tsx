import InfoPageLayout from "@/components/site/InfoPageLayout";
import SectionBar from "@/components/site/SectionBar";

export default function ReturnsPage() {
  return (
    <InfoPageLayout title="Return Policy">
      <div className="space-y-4 text-sm leading-7 text-black/75">
        <SectionBar>Return Eligibility</SectionBar>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Return Window:</strong> Initiate within <strong>30 days</strong> of
            delivery.
          </li>
          <li>
            <strong>Condition:</strong> Items must be unused, unmodified, and in
            original condition with all packaging, labels, and components.
          </li>
          <li>
            <strong>RAN Required:</strong> A Return Authorization Number must be
            obtained before returning any item. Returns without an approved RAN
            will be refused.
          </li>
        </ul>

        <SectionBar>Non-Returnable Items</SectionBar>
        <ul className="list-disc pl-5 space-y-1">
          <li>“For Parts Only” or “As-Is” items.</li>
          <li>
            Installed, modified, or damaged items due to improper installation or
            handling.
          </li>
          <li>
            Items missing essential components or original packaging may be
            refused or may incur a restocking fee.
          </li>
        </ul>

        <SectionBar>How to Initiate a Return</SectionBar>
        <ol className="list-decimal pl-5 space-y-1">
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
            Our team will review your request within <strong>3 business days</strong>{" "}
            and provide return instructions.
          </li>
        </ol>

        <SectionBar>Shipping &amp; Return Process</SectionBar>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            If <strong>our error</strong> caused the issue, we cover return shipping.
          </li>
          <li>
            If <strong>customer error</strong> caused the issue, the customer covers
            return shipping.
          </li>
          <li>
            Items must be securely packed to prevent transit damage and include the
            issued RAN on the package.
          </li>
        </ul>

        <SectionBar>Refunds &amp; Processing</SectionBar>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Refunds are issued within <strong>5–7 business days</strong> after the
            item is received and inspected.
          </li>
          <li>Refunds are credited to the original payment method.</li>
          <li>
            Shipping fees are non-refundable unless the return is due to our error.
          </li>
        </ul>

        <SectionBar>Right to Refuse</SectionBar>
        <p>
          Appliance Part Geeks reserves the right to refuse any return that does
          not meet our policy guidelines or is deemed fraudulent.
        </p>

        <p>
          Need help? Email{" "}
          <a className="underline" href="mailto:returns@appliancepartgeeks.com">
            returns@appliancepartgeeks.com
          </a>
          .
        </p>
      </div>
    </InfoPageLayout>
  );
}
