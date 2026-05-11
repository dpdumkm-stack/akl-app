

"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import i18n from "@/lib/i18n/id.json";

interface Props {
  quotationId: string;
  invoiceId: string;
}

export default function CombinedPdfButton({ quotationId, invoiceId }: Props) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/combine-pdf?quotationId=${quotationId}&invoiceId=${invoiceId}`
      );
      if (!res.ok) throw new Error(i18n.downloadError);

      const blob = await res.blob();
      // Extract filename from header if present
      const disposition = res.headers.get("Content-Disposition");
      let fileName = "combined.pdf";
      if (disposition) {
        const match = disposition.match(/filename="?([^\"]+)"?/);
        if (match && match[1]) fileName = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : i18n.downloadError;
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform transition-all duration-300 ease-out ${loading ? "opacity-60 cursor-not-allowed scale-95" : "scale-100 hover:scale-105"}`}
    >
      {loading ? (
        <span className="animate-pulse text-sm">{i18n.loading}</span>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">{i18n.downloadCombinedPdf}</span>
        </>
      )}
    </button>
  );
}
