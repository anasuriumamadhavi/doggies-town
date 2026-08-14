import { useSite } from "../../context/SiteContext";
import { useLocation } from "react-router-dom";
import { Phone, MessageCircle } from "lucide-react";

export function MobileStickyCTA() {
  const { settings, whatsappLink, callLink, openBookNow, bookNowEnabled } = useSite();
  const location = useLocation();
  if (!settings?.cta?.mobile_sticky_cta) return null;

  const show =
    location.pathname === "/contact" ||
    location.pathname.startsWith("/services/") ||
    location.pathname.startsWith("/packages/");
  if (!show) return null;

  return (
    <div
      data-testid="mobile-sticky-cta"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch gap-2 border-t border-black/5 bg-white/90 px-3 py-2 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
    >
      <a href={whatsappLink()} target="_blank" rel="noopener noreferrer"
        className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl bg-[#25D366]/10 py-2 text-[#128C4A]">
        <MessageCircle className="h-5 w-5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">WhatsApp</span>
      </a>
      <a href={callLink()}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl bg-ink/5 py-2 text-ink">
        <Phone className="h-5 w-5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Call</span>
      </a>
      {bookNowEnabled && (
        <button onClick={openBookNow} data-testid="sticky-book-now-btn"
          className="flex flex-[1.4] items-center justify-center rounded-xl bg-terracotta py-2 text-xs font-bold uppercase tracking-wider text-white">
          {settings?.cta?.book_now_text || "Book Now"}
        </button>
      )}
    </div>
  );
}
