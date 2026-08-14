import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSite } from "../../context/SiteContext";
import { BookNowButton } from "./Buttons";
import { ServiceIcon } from "../../lib/icons";
import { mediaUrl } from "../../lib/api";
import { Menu, X, ChevronDown, ChevronRight, PawPrint } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const NAV_LINKS = [
  { label: "Home", url: "/" },
  { label: "About", url: "/about" },
  { label: "Services", url: "/services", mega: true },
  { label: "Gallery", url: "/gallery" },
  { label: "Packages", url: "/packages" },
  { label: "Contact", url: "/contact" },
];

export function Header() {
  const { settings, services } = useSite();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("no-scroll", mobileOpen);
    return () => document.body.classList.remove("no-scroll");
  }, [mobileOpen]);

  const brand = settings?.business_name || "Pawsome";
  const logo = settings?.logo;

  return (
    <header
      data-testid="site-header"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-black/5 bg-cream/90 backdrop-blur-xl" : "bg-cream/60 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20 md:px-8">
        <Link to="/" data-testid="logo-link" className="flex items-center gap-2">
          {logo ? (
            <img src={mediaUrl(logo)} alt={brand} className="h-9 w-auto" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta text-white">
              <PawPrint className="h-5 w-5" />
            </span>
          )}
          <span className="font-display text-xl font-semibold tracking-tight text-ink md:text-2xl">{brand}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) =>
            link.mega ? (
              <div key={link.url} className="group relative">
                <NavLink
                  to={link.url}
                  data-testid="nav-services"
                  className={({ isActive }) =>
                    `flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isActive ? "text-terracotta" : "text-ink/80 hover:text-terracotta"
                    }`
                  }
                >
                  {link.label}
                  <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
                </NavLink>
                <MegaMenu services={services} />
              </div>
            ) : (
              <NavLink
                key={link.url}
                to={link.url}
                data-testid={`nav-${link.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? "text-terracotta" : "text-ink/80 hover:text-terracotta"
                  }`
                }
              >
                {link.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <BookNowButton size="sm" testId="header-book-now-btn" />
          </div>
          <button
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-ink lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            data-testid="mobile-drawer"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 top-16 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-black/5 bg-cream px-4 pb-10 pt-4 lg:hidden"
          >
            <div className="flex flex-col">
              {NAV_LINKS.map((link) =>
                link.mega ? (
                  <div key={link.url} className="border-b border-black/5">
                    <button
                      data-testid="mobile-services-toggle"
                      onClick={() => setServicesExpanded((v) => !v)}
                      className="flex w-full items-center justify-between py-4 text-lg font-medium text-ink"
                    >
                      Services
                      <ChevronDown className={`h-5 w-5 transition-transform ${servicesExpanded ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {servicesExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-1 pb-3">
                            {services.map((s) => (
                              <Link
                                key={s.id}
                                to={`/services/${s.slug}`}
                                data-testid={`mobile-service-${s.slug}`}
                                className="flex items-center gap-3 rounded-xl px-3 py-3 text-base text-ink/80 hover:bg-white"
                              >
                                <ServiceIcon name={s.icon} className="h-5 w-5 text-terracotta" />
                                {s.name}
                              </Link>
                            ))}
                            <Link to="/services" className="flex items-center gap-2 px-3 py-3 text-sm font-semibold uppercase tracking-wider text-terracotta">
                              View All Services <ChevronRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={link.url}
                    to={link.url}
                    data-testid={`mobile-nav-${link.label.toLowerCase()}`}
                    className="border-b border-black/5 py-4 text-lg font-medium text-ink"
                  >
                    {link.label}
                  </Link>
                )
              )}
              <div className="pt-6">
                <BookNowButton className="w-full justify-center" testId="mobile-book-now-btn" size="lg" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MegaMenu({ services }) {
  return (
    <div className="invisible absolute left-1/2 top-full z-50 w-[720px] -translate-x-1/2 pt-4 opacity-0 transition-all duration-300 group-hover:visible group-hover:opacity-100">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
        <div className="mb-4 flex items-center justify-between">
          <span className="overline text-terracotta">Our Services</span>
          <Link to="/services" className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ink/60 hover:text-terracotta">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {services.map((s) => (
            <Link
              key={s.id}
              to={`/services/${s.slug}`}
              data-testid={`mega-service-${s.slug}`}
              className="group/item flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-cream"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
                <ServiceIcon name={s.icon} className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{s.name}</span>
                <span className="block text-xs leading-relaxed text-ink/55">{s.short_description}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
