import React from "react";

export default function SectionBar({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md bg-[#001F3F] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white">
      {children}
    </div>
  );
}
