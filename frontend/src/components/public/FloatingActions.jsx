import { useSite } from "../../context/SiteContext";
import { Phone, MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

export function FloatingActions() {
  const { settings, whatsappLink, callLink } = useSite();
  const location = useLocation();
  if (!settings) return null;

  const stickyPages = ["/contact"];
  const isStickyPage =
    settings?.cta?.mobile_sticky_cta &&
    (stickyPages.includes(location.pathname) ||
      location.pathname.startsWith("/services/") ||
      location.pathname.startsWith("/packages/"));

  // Lift floating buttons above the mobile sticky bar when present
  const bottomClass = isStickyPage ? "bottom-24 md:bottom-8" : "bottom-6 md:bottom-8";

  return (
    <div
      className={`fixed right-4 md:right-6 z-40 flex flex-col gap-3 ${bottomClass}`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <a
        data-testid="floating-whatsapp-btn"
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_rgba(37,211,102,0.4)] transition-transform duration-300 hover:scale-110"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
      <a
        data-testid="floating-call-btn"
        href={callLink()}
        aria-label="Call us"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-cream shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-transform duration-300 hover:scale-110"
      >
        <Phone className="h-5 w-5" />
      </a>
    </div>
  );
}
