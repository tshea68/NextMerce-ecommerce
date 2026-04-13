import InfoPageLayout from "@/components/site/InfoPageLayout";
import SectionBar from "@/components/site/SectionBar";

export default function RarePartRequestPage() {
  return (
    <InfoPageLayout title="Rare Part Request">
      <div className="space-y-4 text-sm leading-7 text-black/75">
        <SectionBar>Still Looking For That Rare Part?</SectionBar>
        <ul className="list-disc pl-5 space-y-1">
          <li>Need a hard-to-find handle?</li>
          <li>Can’t find that switch or dial?</li>
          <li>Old ice maker needs to be replaced?</li>
        </ul>
        <p>
          We see thousands of recovered refrigerators on a daily basis. Reach
          out to us and we will hunt it down.
        </p>

        <SectionBar>How to Use This Page</SectionBar>
        <p>
          Use the Rare Part Request page to send us the details of the part,
          appliance, and model you are trying to locate.
        </p>
        <p>
          The more detail you provide, the better chance we have of matching
          the exact part or a suitable replacement.
        </p>
      </div>
    </InfoPageLayout>
  );
}
