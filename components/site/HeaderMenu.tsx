"use client";

import Link from "next/link";
import { Menu, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const policyTabs = [
  {
    key: "shipping",
    label: "Shipping Policy",
    href: "/shipping",
    blurb:
      "Orders are typically processed within one business day. International duties and tariffs may apply.",
  },
  {
    key: "returns",
    label: "Return Policy",
    href: "/returns",
    blurb:
      "Eligible returns must be initiated within 30 days and must meet condition and authorization requirements.",
  },
  {
    key: "cancel",
    label: "Cancellation Policy",
    href: "/cancel",
    blurb:
      "Orders may be canceled before shipment. Once shipped, returns must follow the return policy.",
  },
  {
    key: "model",
    label: "How to Find Your Model Number",
    href: "/find-model-number",
    blurb:
      "Find the serial/model tag location for washers, dryers, ovens, refrigerators, dishwashers, and more.",
  },
  {
    key: "rare",
    label: "Rare Part Request",
    href: "/rare-part-request",
    blurb:
      "Need a hard-to-find handle, switch, dial, or old ice maker? Send a request and we’ll help track it down.",
  },
];

const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Shop Parts", href: "/grid" },
  { label: "Track Order", href: "/order" },
];

export default function HeaderMenu() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState("shipping");

  const active = policyTabs.find((t) => t.key === activePolicy) || policyTabs[0];

  return (
    <>
      {/* DESKTOP */}
      <div className="hidden lg:flex items-center justify-start">
        <ul className="flex items-center gap-8 text-sm font-semibold text-black/80 relative">
          {primaryLinks.map((item) => (
            <li key={item.href} className="relative group py-2">
              <Link
                href={item.href}
                className="group-hover:text-blue-600 transition-colors duration-200"
              >
                {item.label}
              </Link>
              <span className="absolute -top-[21px] left-0 h-1 bg-blue-700 rounded-b-md w-0 group-hover:w-full transition-all duration-300 ease-out" />
            </li>
          ))}

          <li className="relative group py-2">
            <div className="flex items-center gap-1 cursor-default group-hover:text-blue-600 transition-colors duration-200">
              <span>Policies</span>
              <ChevronDown size={16} />
            </div>

            <span className="absolute -top-[21px] left-0 h-1 bg-blue-700 rounded-b-md w-0 group-hover:w-full transition-all duration-300 ease-out" />

            <div className="absolute left-0 top-full mt-5 w-[760px] rounded-xl bg-white shadow-xl border border-black/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="grid grid-cols-[260px_1fr] min-h-[320px]">
                <div className="border-r border-black/10 py-3">
                  {policyTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onMouseEnter={() => setActivePolicy(tab.key)}
                      onFocus={() => setActivePolicy(tab.key)}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                        activePolicy === tab.key
                          ? "bg-blue-50 text-blue-700"
                          : "text-black hover:bg-gray-50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-black">{active.label}</h3>
                  <p className="mt-4 text-sm leading-7 text-black/70">{active.blurb}</p>

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

      {/* MOBILE TRIGGER */}
      <div className="lg:hidden flex items-center">
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

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="absolute top-0 right-0 h-full w-[340px] bg-white shadow-2xl flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="font-semibold text-lg text-black">Menu</div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X size={22} className="text-gray-600 hover:text-gray-800" />
              </button>
            </div>

            <hr className="mb-6" />

            <ul className="flex flex-1 overflow-y-auto flex-col gap-4 text-gray-700 font-medium text-[15px]">
              {primaryLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} onClick={() => setMobileOpen(false)} className="hover:text-blue-600">
                    {label}
                  </Link>
                </li>
              ))}

              <li
                className="flex items-center justify-between cursor-pointer hover:text-blue-600"
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
                        className="block text-gray-600 hover:text-blue-600 transition-colors"
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