import { Link } from "react-router-dom";
import { useSite } from "../../context/SiteContext";
import { BookNowButton } from "./Buttons";
import { mediaUrl } from "../../lib/api";
import { PawPrint, Phone, Mail, MapPin, MessageCircle, Instagram, Facebook } from "lucide-react";

export function Footer() {
  const { settings, services } = useSite();
  if (!settings) return null;
  const brand = settings.business_name || "Pawsome";

  return (
    <footer data-testid="site-footer" className="relative overflow-hidden bg-ink text-cream">
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              {settings.logo ? (
                <img src={mediaUrl(settings.logo)} alt={brand} className="h-14 w-auto rounded-2xl bg-white p-2" />
              ) : (
                <>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta text-white">
                    <PawPrint className="h-5 w-5" />
                  </span>
                  <span className="font-display text-2xl font-semibold">{brand}</span>
                </>
              )}
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/60">
              {settings.tagline || "Premium care and personalised attention designed around the pets you love."}
            </p>
            <div className="mt-6 flex gap-3">
              {settings.social?.instagram && (
                <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 hover:bg-cream/10">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {settings.social?.facebook && (
                <a href={settings.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 hover:bg-cream/10">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="overline text-cream/50">Explore</h4>
            <ul className="mt-5 space-y-3 text-sm">
              {[["Home", "/"], ["About", "/about"], ["Services", "/services"], ["Gallery", "/gallery"], ["Packages", "/packages"], ["Contact", "/contact"], ["FAQ", "/faq"]].map(([l, u]) => (
                <li key={u}>
                  <Link to={u} className="text-cream/70 transition-colors hover:text-terracotta">{l}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="overline text-cream/50">Services</h4>
            <ul className="mt-5 space-y-3 text-sm">
              {services.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link to={`/services/${s.slug}`} className="text-cream/70 transition-colors hover:text-terracotta">{s.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="overline text-cream/50">Contact</h4>
            <ul className="mt-5 space-y-4 text-sm text-cream/70">
              <li className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" /><a href={`tel:${settings.phone}`}>{settings.phone}</a></li>
              <li className="flex items-start gap-3"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" /><span>{settings.whatsapp}</span></li>
              <li className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" /><a href={`mailto:${settings.email}`}>{settings.email}</a></li>
              <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" /><span>{settings.address}</span></li>
            </ul>
            <div className="mt-6">
              <BookNowButton size="sm" testId="footer-book-now-btn" />
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-cream/10 pt-6 text-xs text-cream/40 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} {brand}. All rights reserved.</span>
          <span>Crafted with care for pets & the people who love them.</span>
        </div>
      </div>
    </footer>
  );
}
