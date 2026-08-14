import { X } from "lucide-react";

export function Modal({ open, onClose, title, children, footer, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`my-8 w-full ${wide ? "max-w-3xl" : "max-w-xl"} rounded-2xl bg-white shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink/5 px-6 py-4">
          <h3 className="font-display text-xl font-medium text-ink">{title}</h3>
          <button onClick={onClose} data-testid="modal-close" className="rounded-lg p-1 text-ink/40 hover:bg-cream hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-ink/5 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function AdminButton({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-terracotta text-white hover:bg-terracotta/90",
    outline: "border border-ink/15 text-ink hover:bg-cream",
    danger: "bg-destructive text-white hover:bg-destructive/90",
    ghost: "text-ink/60 hover:bg-cream hover:text-ink",
  };
  return (
    <button className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function PageTitle({ title, subtitle, action }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-medium text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink/50">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ value }) {
  const map = {
    published: "bg-green-100 text-green-700", draft: "bg-amber-100 text-amber-700",
    New: "bg-blue-100 text-blue-700", Contacted: "bg-amber-100 text-amber-700",
    Converted: "bg-green-100 text-green-700", Closed: "bg-ink/10 text-ink/60",
    cta: "bg-terracotta/15 text-terracotta", link: "bg-ink/10 text-ink/60",
    sent: "bg-green-100 text-green-700", delivered: "bg-green-100 text-green-700",
    read: "bg-blue-100 text-blue-700", failed: "bg-red-100 text-red-700", pending: "bg-amber-100 text-amber-700",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[value] || "bg-ink/10 text-ink/60"}`}>{value}</span>;
}
