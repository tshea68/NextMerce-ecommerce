import InfoPageLayout from "@/components/site/InfoPageLayout";
import SectionBar from "@/components/site/SectionBar";

export default function FindModelNumberPage() {
  return (
    <InfoPageLayout title="How to Find Your Model Number">
      <div className="space-y-4 text-sm leading-7 text-black/75">
        <SectionBar>Where to Look</SectionBar>
        <p>
          Your appliance’s model number is on its serial tag, which lists both the
          model and serial numbers. The tag’s location varies by appliance type
          and brand.
        </p>

        <SectionBar>Washing Machines</SectionBar>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Front Load:</strong> Inside the door frame.
          </li>
          <li>
            <strong>Top Load:</strong> Under the lid at the back, bottom front
            left of the cabinet, side panels, or back of the console.
          </li>
        </ul>

        <SectionBar>Dryers</SectionBar>
        <ul className="list-disc pl-5 space-y-1">
          <li>Behind the door on the dryer frame.</li>
        </ul>

        <SectionBar>Ranges &amp; Ovens</SectionBar>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Freestanding:</strong> On the oven frame behind the oven
            door or pull-out drawer.
          </li>
          <li>
            <strong>Slide-In:</strong> Behind the oven door, bottom right side
            of the cabinet, or behind the pull-out drawer.
          </li>
          <li>
            <strong>Built-In Wall Ovens:</strong> On the frame behind the oven
            door; some models place it on the casing.
          </li>
          <li>
            <strong>Cooktops:</strong> Underneath or on the sides of the metal
            cabinet.
          </li>
        </ul>

        <SectionBar>Refrigerators &amp; Freezers</SectionBar>
        <ul className="list-disc pl-5 space-y-1">
          <li>Inside the refrigerator section on inner walls.</li>
          <li>Behind the kick panel at the bottom.</li>
          <li>
            <strong>Chest Freezers:</strong> On the front bottom or side of the
            cabinet.
          </li>
        </ul>

        <SectionBar>Microwaves</SectionBar>
        <ul className="list-disc pl-5 space-y-1">
          <li>Inside the microwave on the left wall.</li>
          <li>Outside casing: bottom side.</li>
          <li>
            <strong>Over-the-range:</strong> Underneath toward the back.
          </li>
        </ul>

        <SectionBar>Dishwashers</SectionBar>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Inside the door on the left or right front edge, or on the side of
            the door.
          </li>
        </ul>
      </div>
    </InfoPageLayout>
  );
}
