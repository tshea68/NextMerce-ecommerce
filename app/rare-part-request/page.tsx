export default function RarePartRequestPage() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold mb-6">Rare Part Request</h1>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Still Looking For That Rare Part?</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Need a hard-to-find handle?</li>
              <li>Can’t find that switch or dial?</li>
              <li>Old ice maker needs to be replaced?</li>
            </ul>
            <p>
              We see thousands of recovered refrigerators on a daily basis.
              Reach out to us and we will hunt it down.
            </p>
          </section>

          <section className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-300">
              Form wiring can be dropped in next. This route is now in place for
              the header/footer and for indexing.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Your Name</label>
                <input className="w-full rounded border border-white/20 bg-slate-900 p-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Your Email</label>
                <input className="w-full rounded border border-white/20 bg-slate-900 p-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">What part are you looking for?</label>
                <textarea rows={5} className="w-full rounded border border-white/20 bg-slate-900 p-2 text-white" />
              </div>
              <button className="rounded bg-blue-600 px-4 py-2 text-white opacity-80 cursor-not-allowed" disabled>
                Submit Request
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
