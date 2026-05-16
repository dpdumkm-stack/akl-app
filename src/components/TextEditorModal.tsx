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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Sync from parent value each time modal opens
      setLocalText(value); // eslint-disable-line react-hooks/set-state-in-effect
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const insertFormat = useCallback((prefix: string, suffix: string = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = localText.slice(start, end);
    const newText =
      localText.slice(0, start) +
      prefix +
      selected +
      suffix +
      localText.slice(end);
    setLocalText(newText);
    setTimeout(() => {
      el.focus();
      el.selectionStart = start + prefix.length;
      el.selectionEnd = end + prefix.length;
    }, 0);
  }, [localText]);

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
    blue: { ring: "focus:ring-blue-500/50 focus:border-blue-500", btn: "bg-blue-600 hover:bg-blue-500 shadow-blue-900/40", toolbar: "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30" },
    emerald: { ring: "focus:ring-emerald-500/50 focus:border-emerald-500", btn: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40", toolbar: "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30" },
    amber: { ring: "focus:ring-amber-500/50 focus:border-amber-500", btn: "bg-amber-600 hover:bg-amber-500 shadow-amber-900/40", toolbar: "bg-amber-600/20 text-amber-400 hover:bg-amber-600/30" },
  };
  const accent = accentMap[accentColor];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-slate-900 rounded-t-[32px] sm:rounded-[32px] border border-white/10 shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[80vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center border border-white/5">
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">{title}</h3>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest">Editor Teks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formatting Toolbar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mr-1">Format</span>
          <button
            type="button"
            onClick={() => insertFormat("**", "**")}
            className={`p-2 rounded-lg transition-all ${accent.toolbar} border border-white/5`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("_", "_")}
            className={`p-2 rounded-lg transition-all ${accent.toolbar} border border-white/5`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={insertBullet}
            className={`p-2 rounded-lg transition-all ${accent.toolbar} border border-white/5`}
            title="Bullet Point"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <div className="ml-auto text-[9px] text-slate-700 font-medium tabular-nums">
            {localText.length} karakter
          </div>
        </div>

        {/* Textarea */}
        <div className="flex-1 px-6 py-4 overflow-y-auto">
          <textarea
            ref={textareaRef}
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            placeholder={placeholder}
            className={`w-full h-full min-h-[200px] sm:min-h-[250px] bg-slate-950/50 border-2 border-white/5 rounded-2xl p-4 text-sm font-medium text-white placeholder:text-slate-700 outline-none resize-none transition-all focus:border-white/10 focus:ring-2 ${accent.ring} leading-relaxed`}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all border border-white/5"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 py-3.5 rounded-2xl ${accent.btn} text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2`}
          >
            <Check className="w-4 h-4" />
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
