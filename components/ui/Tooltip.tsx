"use client";

import { useState, ReactNode } from "react";
import { HelpCircle } from "lucide-react";

export function Help({ children, title }: { children: ReactNode; title?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-block relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center text-[#8B949E] hover:text-[#3B82F6] transition-colors align-middle ml-1"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#1C2128] border border-[#30363D] rounded-lg shadow-xl text-xs text-[#F0F6FC] z-50 text-left font-normal">
          {title && <span className="block font-semibold mb-1 text-[#3B82F6]">{title}</span>}
          <span className="block">{children}</span>
        </span>
      )}
    </span>
  );
}

export function InfoCallout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-lg p-4 text-sm">
      {title && <div className="font-semibold text-[#3B82F6] mb-1">{title}</div>}
      <div className="text-[#8B949E]">{children}</div>
    </div>
  );
}
