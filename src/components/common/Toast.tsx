import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantConfig: Record<ToastVariant, { bg: string; icon: typeof CheckCircle2; iconColor: string }> = {
  success: {
    bg: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
    iconColor: "text-emerald-600"
  },
  error: {
    bg: "bg-red-50 border-red-200",
    icon: XCircle,
    iconColor: "text-red-600"
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    icon: AlertTriangle,
    iconColor: "text-amber-600"
  },
  info: {
    bg: "bg-sky-50 border-sky-200",
    icon: Info,
    iconColor: "text-sky-600"
  }
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  }, [toast.id, onRemove]);

  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      dismiss();
    }, toast.duration ?? 4000);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [dismiss, toast.duration]);

  const { bg, icon: Icon, iconColor } = variantConfig[toast.variant];

  return (
    <div
      className={[
        "flex items-start gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-sm",
        "min-w-[280px] max-w-[380px] transition-all",
        bg,
        exiting ? "animate-toast-out" : "animate-toast-in"
      ].join(" ")}
    >
      <Icon className={["h-5 w-5 mt-0.5 flex-shrink-0", iconColor].join(" ")} />
      <p className="flex-1 text-sm font-medium text-slate-800">{toast.message}</p>
      <button
        type="button"
        onClick={dismiss}
        className="flex-shrink-0 rounded-lg p-0.5 text-slate-400 hover:text-slate-600 transition"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant, duration?: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, variant, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue: ToastContextValue = {
    success: (msg, d) => addToast(msg, "success", d),
    error:   (msg, d) => addToast(msg, "error", d),
    warning: (msg, d) => addToast(msg, "warning", d),
    info:    (msg, d) => addToast(msg, "info", d)
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
}
