"use client";

import React, { useState } from "react";
import { Pencil, AlignLeft } from "lucide-react";
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

  const accentBorderMap = {
    blue: "hover:border-blue-500/50 group-hover:text-blue-400",
    emerald: "hover:border-emerald-500/50 group-hover:text-emerald-400",
    amber: "hover:border-amber-500/50 group-hover:text-amber-400",
  };

  const accentIconMap = {
    blue: "text-blue-500",
    emerald: "text-emerald-500",
    amber: "text-amber-500",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group w-full text-left bg-slate-900/80 border-2 border-white/10 rounded-2xl p-5 transition-all hover:bg-slate-900 active:scale-[0.98] ${accentBorderMap[accentColor]} ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {value ? (
              <AlignLeft className={`w-4 h-4 ${accentIconMap[accentColor]}`} />
            ) : (
              <Pencil className="w-4 h-4 text-slate-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {value ? (
              <p className="text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-line line-clamp-3">
                {previewText}
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">{placeholder}</p>
            )}
          </div>
          <div className="flex-shrink-0">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-white/5 border border-white/5 transition-all ${accentIconMap[accentColor]}`}>
              Edit
            </span>
          </div>
        </div>
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
