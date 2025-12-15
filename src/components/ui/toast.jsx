import React, { useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";

const variantStyles = {
  success:
    "bg-[#14532d] text-white border border-[#1f7a40]/40 shadow-[0_10px_30px_-10px_rgba(20,83,45,0.45)]",
  error:
    "bg-[#7f1d1d] text-white border border-[#dc2626]/30 shadow-[0_10px_30px_-10px_rgba(220,38,38,0.45)]",
  warning:
    "bg-[#78350f] text-white border border-[#f59e0b]/30 shadow-[0_10px_30px_-10px_rgba(245,158,11,0.45)]",
  neutral:
    "bg-[#0f141d] text-[#f7f7f1] border border-[#1f2937]/60 shadow-[0_10px_30px_-10px_rgba(31,41,55,0.45)]",
};

const iconByVariant = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  neutral: CheckCircle2,
};

export const Toast = ({
  variant = "neutral",
  title,
  description,
  onClose,
  autoCloseMs = 2000,
}) => {
  useEffect(() => {
    if (!autoCloseMs) return;
    const id = setTimeout(() => {
      onClose?.();
    }, autoCloseMs);
    return () => clearTimeout(id);
  }, [autoCloseMs, onClose]);

  const Icon = iconByVariant[variant] || CheckCircle2;

  return (
    <div
      className={
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 ring-1 ring-black/5 transition-all duration-300 animate-slide-in-up " +
        (variantStyles[variant] || variantStyles.neutral)
      }
      role="status"
      aria-live="polite"
    >
      <div className="mt-0.5">
        <Icon className="h-5 w-5 opacity-90" />
      </div>
      <div className="flex-1">
        {title && <div className="font-semibold tracking-tight">{title}</div>}
        {description && (
          <div className="text-sm opacity-90 leading-snug">{description}</div>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-white/80 hover:text-white hover:bg-white/10 transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export const ToastViewport = ({ children, position = "top-right" }) => {
  const base = "fixed z-[60] flex pointer-events-none";
  const classes =
    position === "top-center"
      ? `${base} top-6 left-1/2 w-full max-w-sm flex-col gap-3`
      : position === "center"
      ? `${base} inset-0 items-center justify-center w-full max-w-sm mx-auto`
      : `${base} top-6 right-6 w-full max-w-sm flex-col gap-3`;
  return <div className={classes}>{children}</div>;
};

// Simple CSS animations via Tailwind utilities
// slide-in-up keyframes are assumed via Tailwind's animate utilities or can be extended in tailwind.config if desired.

export default Toast;


