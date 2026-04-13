import InfoPageLayout from "@/components/site/InfoPageLayout";
import SectionBar from "@/components/site/SectionBar";

export default function CancelPage() {
  return (
    <InfoPageLayout title="Cancellation Policy">
      <div className="space-y-4 text-sm leading-7 text-black/75">
        <SectionBar>Need to Cancel Your Order?</SectionBar>
        <p>
          Appliance repairs are time-sensitive, and at Appliance Part Geeks, we
          prioritize fast and efficient shipping. If you need to cancel your
          order, please contact us immediately at{" "}
          <a className="underline" href="mailto:support@appliancepartgeeks.com">
            support@appliancepartgeeks.com
          </a>
          .
        </p>

        <SectionBar>Can I Cancel Before It Ships?</SectionBar>
        <p>
          Yes. Orders canceled before shipment will receive a <strong>full refund</strong>.
          Due to quick processing times, reach out as soon as possible to request
          a cancellation.
        </p>

        <SectionBar>What If My Order Has Already Shipped?</SectionBar>
        <p>
          If you received a shipping confirmation email, your order is already on
          its way and cannot be canceled. Once the item arrives, you may return it
          for a full refund in accordance with our return policy.
        </p>
      </div>
    </InfoPageLayout>
  );
}
