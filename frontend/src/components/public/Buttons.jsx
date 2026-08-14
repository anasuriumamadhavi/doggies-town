import { useSite } from "../../context/SiteContext";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";

export function BookNowButton({ className, label, testId = "book-now-btn", size = "md" }) {
  const { openBookNow, bookNowText, bookNowEnabled } = useSite();
  if (!bookNowEnabled) return null;
  const sizes = { sm: "px-5 py-2 text-xs", md: "px-7 py-3 text-sm", lg: "px-9 py-4 text-sm" };
  return (
    <button
      data-testid={testId}
      onClick={openBookNow}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full bg-terracotta font-semibold uppercase tracking-[0.14em] text-white",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(200,122,91,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2",
        sizes[size], className
      )}
    >
      {label || bookNowText}
      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  );
}

export function OutlineButton({ children, className, testId, ...props }) {
  return (
    <button
      data-testid={testId}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-ink/15 px-7 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
        className
      )}
      {...props}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </button>
  );
}
