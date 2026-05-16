"use client";

import React, { useState } from "react";
import { Pencil, AlignLeft, ChevronRight } from "lucide-react";
import TextEditorModal from "@/components/TextEditorModal";

interface TextEditorTriggerProps {
  value: string;
  onChange: (value: string) => void;
  title: string;
  placeholder?: string;
  accentColor?: "blue" | "emerald" | "amber";
  className?: string;
}

export default function TextEditorTrigger({
  value,
  onChange,
  title,
  placeholder = "Klik untuk menulis teks...",
  accentColor = "blue",
  className = "",
}: TextEditorTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const previewText = value
    ? value.slice(0, 120) + (value.length > 120 ? "..." : "")
    : "";

  const accentMap = {
    blue: {
      border: "hover:border-blue-500/40 focus-visible:border-blue-500/60",
      icon: "text-blue-500",
      badge: "text-blue-400 bg-blue-500/10 border-blue-500/20 group-hover:bg-blue-500/20 group-hover:border-blue-500/30",
      glow: "group-hover:shadow-blue-900/20",
    },
    emerald: {
      border: "hover:border-emerald-500/40 focus-visible:border-emerald-500/60",
      icon: "text-emerald-500",
      badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30",
      glow: "group-hover:shadow-emerald-900/20",
    },
    amber: {
      border: "hover:border-amber-500/40 focus-visible:border-amber-500/60",
      icon: "text-amber-500",
      badge: "text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500/20 group-hover:border-amber-500/30",
      glow: "group-hover:shadow-amber-900/20",
    },
  };
  const a = accentMap[accentColor];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`
          group w-full text-left
          bg-slate-900/70 hover:bg-slate-900
          border-2 border-white/[0.07] ${a.border}
          rounded-2xl p-4 sm:p-5
          shadow-sm hover:shadow-lg ${a.glow}
          transition-all duration-250 ease-out
          active:scale-[0.98] active:duration-75
          outline-none focus-visible:ring-2 focus-visible:ring-offset-0
          ${className}
        `}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110">
            {value ? (
              <AlignLeft className={`w-4 h-4 ${a.icon}`} />
            ) : (
              <Pencil className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors duration-200" />
            )}
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            {value ? (
              <p className="text-[13px] sm:text-xs text-slate-300 group-hover:text-slate-200 leading-relaxed font-medium whitespace-pre-line line-clamp-3 transition-colors duration-200">
                {previewText}
              </p>
            ) : (
              <p className="text-xs text-slate-600 italic group-hover:text-slate-500 transition-colors duration-200">
                {placeholder}
              </p>
            )}
          </div>

          {/* Edit badge + chevron */}
          <div className="flex-shrink-0 flex items-center gap-1 ml-1">
            <span
              className={`
                text-[9px] font-black uppercase tracking-widest
                px-2.5 py-1 rounded-lg border
                transition-all duration-200
                ${a.badge}
              `}
            >
              Edit
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-200" />
          </div>
        </div>

        {/* Bottom word-count hint when has value */}
        {value && (
          <div className="mt-2.5 ml-7 flex items-center gap-1.5">
            <div className="h-px flex-1 bg-white/[0.04]" />
            <span className="text-[9px] text-slate-700 font-medium tabular-nums">
              {value.length} karakter
            </span>
          </div>
        )}
      </button>

      <TextEditorModal
        isOpen={isOpen}
        value={value}
        title={title}
        placeholder={placeholder}
        onSave={onChange}
        onClose={() => setIsOpen(false)}
        accentColor={accentColor}
      />
    </>
  );
}
