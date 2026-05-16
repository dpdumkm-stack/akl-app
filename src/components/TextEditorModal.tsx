"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Bold, Italic, List, Check, FileText } from "lucide-react";

interface TextEditorModalProps {
  isOpen: boolean;
  value: string;
  title: string;
  placeholder?: string;
  onSave: (value: string) => void;
  onClose: () => void;
  accentColor?: "blue" | "emerald" | "amber";
}

export default function TextEditorModal({
  isOpen,
  value,
  title,
  placeholder = "Ketik teks di sini...",
  onSave,
  onClose,
  accentColor = "blue",
}: TextEditorModalProps) {
  // localText is initialized from value prop and lives independently
  const [localText, setLocalText] = useState(value);
  const [visible, setVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- LOGIKA ANIMASI: render dulu, lalu trigger CSS transition ---
  useEffect(() => {
    if (isOpen) {
      setLocalText(value); // eslint-disable-line react-hooks/set-state-in-effect
      // Beri waktu satu frame agar elemen ter-render sebelum animasi dimulai
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      setTimeout(() => textareaRef.current?.focus(), 200);
    } else {
      setVisible(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      adjustHeight();
    }
  }, [localText, isOpen, adjustHeight]);

  const insertFormat = useCallback(
    (prefix: string, suffix: string = "") => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = localText.slice(start, end);
      const newText =
        localText.slice(0, start) + prefix + selected + suffix + localText.slice(end);
      setLocalText(newText);
      setTimeout(() => {
        el.focus();
        el.selectionStart = start + prefix.length;
        el.selectionEnd = end + prefix.length;
      }, 0);
    },
    [localText]
  );

  const insertBullet = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart;
    const before = localText.slice(0, pos);
    const after = localText.slice(pos);
    const prefix = before.endsWith("\n") || before === "" ? "• " : "\n• ";
    const newText = before + prefix + after;
    setLocalText(newText);
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = pos + prefix.length;
    }, 0);
  }, [localText]);

  const handleSave = () => {
    onSave(localText);
    onClose();
  };

  const accentMap = {
    blue: {
      ring: "focus:ring-blue-500/40 focus:border-blue-500/70",
      btn: "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-blue-900/50",
      toolbar: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/25 border-blue-500/20 active:bg-blue-500/30",
      icon: "text-blue-400",
      glow: "shadow-blue-900/30",
      iconBg: "bg-blue-600/15 border-blue-500/25",
    },
    emerald: {
      ring: "focus:ring-emerald-500/40 focus:border-emerald-500/70",
      btn: "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-900/50",
      toolbar: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/20 active:bg-emerald-500/30",
      icon: "text-emerald-400",
      glow: "shadow-emerald-900/30",
      iconBg: "bg-emerald-600/15 border-emerald-500/25",
    },
    amber: {
      ring: "focus:ring-amber-500/40 focus:border-amber-500/70",
      btn: "bg-amber-600 hover:bg-amber-500 active:bg-amber-700 shadow-amber-900/50",
      toolbar: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/25 border-amber-500/20 active:bg-amber-500/30",
      icon: "text-amber-400",
      glow: "shadow-amber-900/30",
      iconBg: "bg-amber-600/15 border-amber-500/25",
    },
  };
  const accent = accentMap[accentColor];

  if (!isOpen) return null;

  return (
    // OVERLAY — animasi fade-in dari opacity-0
    <div
      className={`fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ease-out ${
        visible ? "bg-black/75 backdrop-blur-md" : "bg-black/0 backdrop-blur-none"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* PANEL MODAL — slide-up dari bawah di mobile, scale dari tengah di desktop */}
      <div
        className={`
          w-full sm:max-w-lg
          bg-slate-900/95 backdrop-blur-xl
          rounded-t-[32px] sm:rounded-[28px]
          border border-white/[0.08]
          shadow-2xl ${accent.glow}
          ring-1 ring-white/5
          flex flex-col max-h-[95dvh] sm:max-h-[85vh]
          transition-all duration-300 ease-out
          ${visible
            ? "translate-y-0 sm:scale-100 opacity-100"
            : "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0"
          }
        `}
      >
        {/* ── HANDLE BAR (Mobile only) ── */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-white/15 rounded-full" />
        </div>

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-5 pt-4 sm:pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${accent.iconBg}`}>
              <FileText className={`w-4 h-4 ${accent.icon}`} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider leading-none">
                {title}
              </h3>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
                Editor Teks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-slate-500 hover:text-white hover:bg-white/8 active:bg-white/12 rounded-xl transition-all duration-200 active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── FORMATTING TOOLBAR ── */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mr-1 ml-1 flex-shrink-0">
            Format
          </span>
          <button
            type="button"
            onClick={() => insertFormat("**", "**")}
            title="Bold"
            className={`w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl border transition-all duration-150 active:scale-90 active:duration-75 ${accent.toolbar}`}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("_", "_")}
            title="Italic"
            className={`w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl border transition-all duration-150 active:scale-90 active:duration-75 ${accent.toolbar}`}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={insertBullet}
            title="Bullet"
            className={`w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl border transition-all duration-150 active:scale-90 active:duration-75 ${accent.toolbar}`}
          >
            <List className="w-4 h-4" />
          </button>

          <div className="ml-auto flex-shrink-0 flex items-center gap-1.5">
            <span className="text-[9px] text-slate-600 tabular-nums font-medium">
              {localText.length}
            </span>
            <span className="text-[9px] text-slate-700 font-medium">karakter</span>
          </div>
        </div>

        {/* ── TEXTAREA AREA ── */}
        <div className="flex-1 px-4 sm:px-5 py-4 overflow-y-auto custom-scrollbar">
          <textarea
            ref={textareaRef}
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            placeholder={placeholder}
            className={`
              w-full min-h-[140px]
              bg-slate-950/60 border-2 border-white/[0.06]
              rounded-2xl p-4
              text-[15px] sm:text-sm font-medium
              text-slate-100 placeholder:text-slate-700
              outline-none resize-none
              leading-[1.75] tracking-wide
              transition-all duration-200
              focus:border-white/12 focus:bg-slate-950/80
              focus:ring-2 ${accent.ring}
              overflow-hidden
            `}
          />
          {/* Hint di bawah textarea */}
          <p className="text-[9px] text-slate-700 font-medium mt-2 ml-1">
            Gunakan toolbar di atas untuk formatting teks
          </p>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="flex gap-3 px-4 sm:px-5 pb-6 pt-2">
          <button
            onClick={onClose}
            className="
              flex-1 py-4 rounded-2xl
              bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-800
              text-slate-400 hover:text-white
              font-black text-[10px] uppercase tracking-widest
              border border-white/[0.06]
              transition-all duration-200 active:scale-[0.97]
            "
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className={`
              flex-1 py-4 rounded-2xl
              ${accent.btn}
              text-white font-black text-[10px] uppercase tracking-widest
              transition-all duration-200 active:scale-[0.97]
              shadow-lg flex items-center justify-center gap-2
            `}
          >
            <Check className="w-4 h-4" />
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
