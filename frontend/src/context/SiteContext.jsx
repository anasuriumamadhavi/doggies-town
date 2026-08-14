import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [nav, setNav] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, n, svc] = await Promise.all([
        api.get("/public/settings"),
        api.get("/public/navigation"),
        api.get("/public/services"),
      ]);
      setSettings(s.data);
      setNav((n.data || []).filter((x) => x.visible).sort((a, b) => a.display_order - b.display_order));
      setServices(svc.data || []);
    } catch (e) {
      console.error("site load failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (settings?.seo?.title) document.title = settings.seo.title;
    if (settings?.seo?.favicon) {
      let link = document.querySelector("link[rel='icon']");
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = settings.seo.favicon;
    }
  }, [settings]);

  const bookNowUrl = settings?.cta?.erp_booking_url || "#";
  const bookNowEnabled = settings?.cta?.book_now_enabled !== false;
  const bookNowText = settings?.cta?.book_now_text || "Book Now";
  const openNewTab = (settings?.cta?.open_behavior || "new_tab") === "new_tab";

  const openBookNow = useCallback(() => {
    if (!bookNowEnabled) return;
    if (openNewTab) window.open(bookNowUrl, "_blank", "noopener");
    else window.location.href = bookNowUrl;
  }, [bookNowUrl, bookNowEnabled, openNewTab]);

  const digits = (settings?.whatsapp || "").replace(/[^0-9]/g, "");
  const whatsappLink = (message) =>
    `https://wa.me/${digits}?text=${encodeURIComponent(message || settings?.whatsapp_settings?.default_message || "Hi")}`;

  const callLink = () => `tel:${(settings?.phone || "").replace(/\s/g, "")}`;

  return (
    <SiteContext.Provider
      value={{ settings, nav, services, loading, reload: load,
        bookNowUrl, bookNowEnabled, bookNowText, openNewTab, openBookNow,
        whatsappLink, callLink }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used within SiteProvider");
  return ctx;
}
