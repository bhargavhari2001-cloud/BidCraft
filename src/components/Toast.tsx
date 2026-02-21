"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastData {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
  },
  error: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    icon: "text-red-400",
  },
  info: {
    border: "border-violet-500/30",
    bg: "bg-violet-500/10",
    icon: "text-violet-400",
  },
};

// Global toast state
let toastListeners: ((toasts: ToastData[]) => void)[] = [];
let toasts: ToastData[] = [];

function notify(listeners: ((toasts: ToastData[]) => void)[]) {
  listeners.forEach((l) => l([...toasts]));
}

export function showToast(type: ToastData["type"], message: string) {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, type, message }];
  notify(toastListeners);
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify(toastListeners);
  }, 4000);
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastData[]>([]);

  useEffect(() => {
    toastListeners.push(setItems);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setItems);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify(toastListeners);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {items.map((toast) => {
        const Icon = icons[toast.type];
        const color = colors[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${color.border} ${color.bg} backdrop-blur-xl shadow-2xl animate-in slide-in-from-right`}
            style={{ animation: "slideIn 0.3s ease-out" }}
          >
            <Icon className={`w-4 h-4 ${color.icon} shrink-0`} />
            <span className="text-sm text-white/80">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-2 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
