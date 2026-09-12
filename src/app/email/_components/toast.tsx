"use client";

import { useCallback, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export type ToastMsg = { text: string; type: "success" | "error" };

export function useToast() {
  const [toast, setToast] = useState<ToastMsg | null>(null);

  const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  return { toast, showToast, closeToast };
}

export function Toast({ toast, onClose }: { toast: ToastMsg | null; onClose: () => void }) {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 max-w-md ${
        toast.type === "success"
          ? "bg-[#eef5eb] border-[#b9d9af] text-[#3b662e]"
          : "bg-[#fef2f2] border-[#fecaca] text-[#b0574e]"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCircle2 className="w-4 h-4 text-[#74896a] shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-[#b0574e] shrink-0" />
      )}
      <span>{toast.text}</span>
      <button
        onClick={onClose}
        className="ml-2 text-[#8a7e78] hover:text-[#453127] shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
