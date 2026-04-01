export default function FindModelNumberPage() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold mb-6">How to Find Your Model Number</h1>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Where to Look</h2>
            <p>
              Your appliance’s model number is on its serial tag, which lists
              both the model and serial numbers. The tag location varies by appliance type and brand.
            </p>

            <h3 className="text-lg font-semibold pt-3">Washing Machines</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Front Load:</strong> Inside the door frame.</li>
              <li><strong>Top Load:</strong> Under the lid at the back, bottom front left of the cabinet, side panels, or back of the console.</li>
            </ul>

            <h3 className="text-lg font-semibold pt-3">Dryers</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Behind the door on the dryer frame.</li>
            </ul>

            <h3 className="text-lg font-semibold pt-3">Ranges &amp; Ovens</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Freestanding:</strong> On the oven frame behind the oven door or pull-out drawer.</li>
              <li><strong>Slide-In:</strong> Behind the oven door, bottom right side, or behind the pull-out drawer.</li>
              <li><strong>Built-In Wall Ovens:</strong> On the frame behind the oven door; sometimes on the casing.</li>
              <li><strong>Cooktops:</strong> Underneath or on the sides of the metal cabinet.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Refrigerators &amp; Freezers</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Inside the refrigerator section on inner walls.</li>
              <li>Behind the kick panel at the bottom.</li>
              <li><strong>Chest Freezers:</strong> On the front bottom or side of the cabinet.</li>
            </ul>

            <h3 className="text-lg font-semibold pt-3">Dishwashers</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Inside the door frame.</li>
              <li>On the tub edge or side of the door opening.</li>
            </ul>

            <h3 className="text-lg font-semibold pt-3">Microwaves</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Inside the door opening.</li>
              <li>On the back panel.</li>
            </ul>

            <p className="pt-3 text-slate-300">
              If you still can’t find your model number, contact us and we’ll help point you in the right direction.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
