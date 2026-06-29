"use client";

import Link from "next/link";
import { Menu, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Track Order", href: "/order" },
];

const policyTabs = [
  { key: "rare", label: "Rare Part Request", href: "/rare-part-request" },
  { key: "ship", label: "Shipping Policy", href: "/shipping" },
  { key: "return", label: "Our Return Policy", href: "/returns" },
  { key: "cancel", label: "Cancellation Policy", href: "/cancel" },
  { key: "model", label: "How to Find Your Model Number", href: "/find-model-number" },
];

export default function HeaderMenu() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState("ship");

  const active = policyTabs.find((t) => t.key === activePolicy) || policyTabs[0];

  return (
    <>
      <div className="hidden lg:flex items-center justify-start">
        <ul className="relative flex items-center gap-8 text-sm font-semibold text-black/80">
          {primaryLinks.map((item) => (
            <li key={item.href} className="group relative py-2">
              <Link
                href={item.href}
                className="transition-colors duration-200 group-hover:text-blue-600"
              >
                {item.label}
              </Link>
              <span className="absolute left-0 -top-[21px] h-1 w-0 rounded-b-md bg-blue-700 transition-all duration-300 ease-out group-hover:w-full" />
            </li>
          ))}

          <li className="group relative py-2">
            <div className="flex cursor-default items-center gap-1 transition-colors duration-200 group-hover:text-blue-600">
              <span>Policies</span>
              <ChevronDown size={16} />
            </div>

            <span className="absolute left-0 -top-[21px] h-1 w-0 rounded-b-md bg-blue-700 transition-all duration-300 ease-out group-hover:w-full" />

            <div className="invisible absolute left-1/2 top-full z-50 mt-5 w-[min(90vw,64rem)] -translate-x-1/2 rounded border border-black/10 bg-white opacity-0 shadow-lg ring-1 ring-black/5 transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <div className="rounded-t bg-[#001F3F] px-4 py-2 text-[13px] font-semibold uppercase tracking-wide text-white">
                {active.label}
              </div>

              <div className="grid max-h-[500px] grid-cols-[260px_1fr] overflow-hidden">
                <div className="border-r border-black/10 py-3">
                  {policyTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onMouseEnter={() => setActivePolicy(tab.key)}
                      onFocus={() => setActivePolicy(tab.key)}
                      className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                        activePolicy === tab.key
                          ? "bg-blue-50 text-blue-700"
                          : "text-black hover:bg-gray-50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="max-h-[500px] overflow-y-auto p-4 text-sm text-black">
                  {active.key === "rare" && (
                    <div className="flex flex-col gap-6 md:flex-row">
                      <div className="w-full space-y-4 md:w-1/2">
                        <h2 className="text-xl font-bold">
                          Still Looking For That Rare Part?
                        </h2>
                        <ul className="list-disc pl-5">
                          <li>Need a hard-to-find handle?</li>
                          <li>Can’t find that switch or dial?</li>
                          <li>Old ice maker needs to be replaced?</li>
                        </ul>
                        <p>
                          We see thousands of recovered refrigerators on a daily
                          basis. Reach out to us and we will hunt it down.
                        </p>
                      </div>

                      <div className="w-full space-y-3 md:w-1/2">
                        <div className="space-y-3">
                          <div className="flex flex-col">
                            <label htmlFor="rare-name" className="font-medium">
                              Your Name
                            </label>
                            <input
                              id="rare-name"
                              type="text"
                              className="rounded border p-2"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label htmlFor="rare-email" className="font-medium">
                              Your Email
                            </label>
                            <input
                              id="rare-email"
                              type="email"
                              className="rounded border p-2"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label htmlFor="rare-message" className="font-medium">
                              What part are you looking for?
                            </label>
                            <textarea
                              id="rare-message"
                              rows={4}
                              className="rounded border p-2"
                            />
                          </div>

                          <Link
                            href="/rare-part-request"
                            className="inline-flex rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                          >
                            Open full request page
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {active.key === "ship" && (
                    <div className="flex flex-col gap-6 md:flex-row">
                      <div className="w-full space-y-2 md:w-1/3">
                        <h5 className="font-semibold">Fast &amp; Reliable Shipping</h5>
                        <p>
                          At <strong>Appliance Part Geeks</strong>, we prioritize
                          fast and efficient shipping to ensure you receive your
                          order as quickly as possible. All orders are processed
                          and shipped within <strong>one business day</strong>.
                        </p>
                        <p>
                          Orders placed before our daily shipping cutoff time
                          will be shipped the <strong>same business day</strong>.
                          Orders placed after the cutoff time will be shipped the{" "}
                          <strong>next business day</strong>.
                        </p>

                        <h5 className="font-semibold">Tracking &amp; Delivery</h5>
                        <p>
                          Once your order has shipped, you will receive a
                          tracking number via email. Delivery times vary based
                          on the shipping method selected at checkout.
                        </p>
                      </div>

                      <div className="w-full space-y-2 md:w-1/3">
                        <h5 className="font-semibold">Shipping Address Accuracy</h5>
                        <p>
                          Please double-check your shipping address before
                          submitting payment. We can only ship to the address
                          provided at checkout.
                        </p>
                        <ul className="list-disc pl-5">
                          <li>
                            <strong>Address Changes:</strong> Once an order has
                            been placed, we are unable to modify the shipping
                            address.
                          </li>
                          <li>
                            <strong>Undeliverable Packages:</strong> If an order
                            is returned due to an incorrect or incomplete
                            address, the buyer will be responsible for any
                            additional shipping costs.
                          </li>
                        </ul>

                        <h5 className="font-semibold">Shipping Carriers &amp; Methods</h5>
                        <ul className="list-disc pl-5">
                          <li>
                            <strong>Domestic Shipping:</strong> Standard and
                            expedited shipping options are available at
                            checkout.
                          </li>
                          <li>
                            <strong>International Shipping:</strong> Availability
                            depends on the destination country. Additional
                            customs duties or taxes may apply.
                          </li>
                        </ul>

                        <h5 className="font-semibold">Lost or Delayed Shipments</h5>
                        <p>
                          If your package is delayed or lost in transit,
                          please contact the carrier first using your tracking
                          number. If further assistance is needed, email{" "}
                          <a
                            className="text-blue-700 underline"
                            href="mailto:support@appliancepartgeeks.com"
                          >
                            support@appliancepartgeeks.com
                          </a>
                          .
                        </p>
                      </div>

                      <div className="w-full space-y-2 md:w-1/3">
                        <h5 className="font-semibold">International Customers – Please Read</h5>
                        <p>
                          <strong>Effective: March 18, 2025</strong>
                        </p>
                        <p>
                          This policy applies only to international orders—any orders
                          shipped outside the United States, including Canada, Mexico,
                          and other countries.
                        </p>

                        <h6 className="font-semibold">Shipping Costs</h6>
                        <p>
                          Some international orders may require additional
                          shipping fees. If additional fees apply, we will
                          contact you. If we do not receive a response within
                          2 days, the order may be canceled and refunded.
                        </p>

                        <h6 className="font-semibold">Customs &amp; Duties</h6>
                        <p>
                          The receiver is responsible for all duties, tariffs, and
                          taxes. We do not collect these at checkout. We will never
                          undervalue a shipment or mark it as a gift.
                        </p>

                        <h6 className="font-semibold">Refused Deliveries &amp; No Refunds</h6>
                        <p>
                          If duties/tariffs are refused, we will instruct the
                          carrier to dispose of the shipment. No refund will be
                          issued.
                        </p>

                        <h6 className="font-semibold">Delivery Times &amp; Customs Delays</h6>
                        <p>
                          International shipping times vary; customs clearance may
                          cause delays beyond our control.
                        </p>

                        <h6 className="font-semibold">Order Feasibility</h6>
                        <p>
                          For low-value items with disproportionately high shipping,
                          we may reach out to discuss options before proceeding.
                        </p>

                        <p className="text-xs italic">
                          By placing an order with Appliance Part Geeks, you
                          agree to these terms.
                        </p>
                      </div>
                    </div>
                  )}

                  {active.key === "return" && (
                    <div className="flex flex-col gap-6 md:flex-row">
                      <div className="w-full space-y-2 md:w-1/3">
                        <h5 className="font-semibold">Return Eligibility</h5>
                        <ul className="list-disc pl-5">
                          <li>
                            <strong>Return Window:</strong> Initiate within{" "}
                            <strong>30 days</strong> of delivery.
                          </li>
                          <li>
                            <strong>Condition:</strong> Items must be unused,
                            unmodified, and in original condition with all
                            packaging, labels, and components.
                          </li>
                          <li>
                            <strong>RAN Required:</strong> A Return
                            Authorization Number must be obtained before
                            returning any item. Returns without an approved
                            RAN will be refused.
                          </li>
                        </ul>

                        <h5 className="font-semibold">Non-Returnable Items</h5>
                        <ul className="list-disc pl-5">
                          <li>“For Parts Only” or “As-Is” items.</li>
                          <li>
                            Installed, modified, or damaged items due to improper
                            installation/handling.
                          </li>
                          <li>
                            Items missing essential components or original
                            packaging (may be refused or incur a restocking fee).
                          </li>
                        </ul>
                      </div>

                      <div className="w-full space-y-2 md:w-1/3">
                        <h5 className="font-semibold">How to Initiate a Return</h5>
                        <ol className="list-decimal pl-5 space-y-1">
                          <li>
                            Email{" "}
                            <a
                              className="text-blue-700 underline"
                              href="mailto:returns@appliancepartgeeks.com"
                            >
                              returns@appliancepartgeeks.com
                            </a>{" "}
                            with your order number in the subject line.
                          </li>
                          <li>
                            Include your full name, order date, reason for return,
                            and photos (if applicable).
                          </li>
                          <li>
                            Our team will review your request within{" "}
                            <strong>3 business days</strong> and provide return
                            instructions.
                          </li>
                        </ol>

                        <h5 className="font-semibold">Shipping &amp; Return Process</h5>
                        <ul className="list-disc pl-5">
                          <li>
                            If <strong>our error</strong> (wrong/defective item), we
                            cover return shipping.
                          </li>
                          <li>
                            If <strong>customer error</strong> (wrong item, changed
                            mind), customer covers return shipping.
                          </li>
                          <li>
                            Items must be securely packed to prevent transit damage
                            and include the issued RAN on the package.
                          </li>
                        </ul>
                      </div>

                      <div className="w-full space-y-2 md:w-1/3">
                        <h5 className="font-semibold">Refunds &amp; Processing</h5>
                        <ul className="list-disc pl-5">
                          <li>
                            Refunds issued within <strong>5–7 business days</strong>{" "}
                            after item is received and inspected.
                          </li>
                          <li>Refunds credited to the original payment method.</li>
                          <li>
                            Shipping fees are non-refundable unless the return is due
                            to our error.
                          </li>
                        </ul>

                        <h5 className="font-semibold">Right to Refuse</h5>
                        <p>
                          Appliance Part Geeks reserves the right to refuse any return
                          that does not meet our policy guidelines or is deemed
                          fraudulent.
                        </p>

                        <p className="text-sm">
                          Need help? Email{" "}
                          <a
                            className="text-blue-700 underline"
                            href="mailto:returns@appliancepartgeeks.com"
                          >
                            returns@appliancepartgeeks.com
                          </a>
                          .
                        </p>
                      </div>
                    </div>
                  )}

                  {active.key === "cancel" && (
                    <div className="flex flex-col gap-6 md:flex-row">
                      <div className="w-full space-y-2 md:w-1/2">
                        <h5 className="font-semibold">Need to Cancel Your Order?</h5>
                        <p>
                          Appliance repairs are time-sensitive, and at Appliance Part
                          Geeks, we prioritize fast and efficient shipping. If you
                          need to cancel your order, please contact us immediately at{" "}
                          <a
                            className="text-blue-700 underline"
                            href="mailto:support@appliancepartgeeks.com"
                          >
                            support@appliancepartgeeks.com
                          </a>
                          .
                        </p>

                        <h5 className="font-semibold">Can I Cancel Before It Ships?</h5>
                        <p>
                          Yes! Orders canceled before shipment will receive a{" "}
                          <strong>full refund</strong>. Due to quick processing times,
                          reach out as soon as possible to request a cancellation.
                        </p>
                      </div>

                      <div className="w-full space-y-2 md:w-1/2">
                        <h5 className="font-semibold">What If My Order Has Already Shipped?</h5>
                        <p>
                          If you received a shipping confirmation email, your order is
                          already on its way and can’t be canceled. Once the item
                          arrives, you may <strong>return it for a full refund</strong>{" "}
                          in accordance with our return policy.
                        </p>
                      </div>
                    </div>
                  )}

                  {active.key === "model" && (
                    <div className="flex flex-col gap-6 md:flex-row">
                      <div className="w-full space-y-2 md:w-1/2">
                        <h5 className="font-semibold">Where to Look</h5>
                        <p>
                          Your appliance’s model number is on its serial tag, which
                          lists both the model and serial numbers. The tag’s location
                          varies by appliance type and brand.
                        </p>

                        <h6 className="mt-2 font-semibold">Washing Machines</h6>
                        <ul className="list-disc pl-5">
                          <li>
                            <strong>Front Load:</strong> Inside the door frame.
                          </li>
                          <li>
                            <strong>Top Load:</strong> Under the lid at the back,
                            bottom front left of the cabinet, side panels, or back of
                            the console (use a mirror if needed).
                          </li>
                        </ul>

                        <h6 className="mt-2 font-semibold">Dryers</h6>
                        <ul className="list-disc pl-5">
                          <li>Behind the door on the dryer frame.</li>
                        </ul>

                        <h6 className="mt-2 font-semibold">Ranges &amp; Ovens</h6>
                        <ul className="list-disc pl-5">
                          <li>
                            <strong>Freestanding:</strong> On the oven frame behind
                            the oven door or pull-out drawer.
                          </li>
                          <li>
                            <strong>Slide-In:</strong> Behind the oven door, bottom
                            right side of the cabinet, or behind the pull-out drawer.
                          </li>
                          <li>
                            <strong>Built-In Wall Ovens:</strong> On the frame behind
                            the oven door; some models place it on the casing (may
                            require removal from the wall).
                          </li>
                          <li>
                            <strong>Cooktops:</strong> Underneath or on the sides of
                            the metal cabinet.
                          </li>
                        </ul>
                      </div>

                      <div className="w-full space-y-2 md:w-1/2">
                        <h6 className="font-semibold">Refrigerators &amp; Freezers</h6>
                        <ul className="list-disc pl-5">
                          <li>Inside the refrigerator section on inner walls.</li>
                          <li>Behind the kick panel at the bottom.</li>
                          <li>
                            <strong>Chest Freezers:</strong> On the front bottom or
                            side of the cabinet.
                          </li>
                        </ul>

                        <h6 className="mt-2 font-semibold">Microwaves</h6>
                        <ul className="list-disc pl-5">
                          <li>Inside the microwave on the left wall.</li>
                          <li>Outside casing: Bottom side.</li>
                          <li>
                            <strong>Over-the-range:</strong> Underneath towards the
                            back.
                          </li>
                        </ul>

                        <h6 className="mt-2 font-semibold">Dishwashers</h6>
                        <ul className="list-disc pl-5">
                          <li>
                            Inside the door on the left or right front edge, or on the
                            side of the door.
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <Link
                      href={active.href}
                      className="inline-flex items-center rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
                    >
                      View full page
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div className="flex items-center lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded border border-black/15 bg-white px-3 py-2 text-sm font-medium text-black"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
          <div className="absolute right-3 top-3 flex max-h-[calc(100vh-24px)] w-[340px] flex-col bg-white p-5 shadow-2xl overflow-y-auto rounded-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="text-lg font-semibold text-black">Menu</div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X size={22} className="text-gray-600 hover:text-gray-800" />
              </button>
            </div>

            <hr className="mb-6" />

            <ul className="flex flex-1 flex-col gap-4 overflow-y-auto text-[15px] font-medium text-gray-700">
              {primaryLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="hover:text-blue-600"
                  >
                    {label}
                  </Link>
                </li>
              ))}

              <li
                className="flex cursor-pointer items-center justify-between hover:text-blue-600"
                onClick={() => setPoliciesOpen((v) => !v)}
              >
                <span>Policies</span>
                {policiesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </li>

              {policiesOpen && (
                <ul className="ml-4 flex flex-col gap-4 text-sm">
                  {policyTabs.map(({ label, href }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => {
                          setPoliciesOpen(false);
                          setMobileOpen(false);
                        }}
                        className="block text-gray-600 transition-colors hover:text-blue-600"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}