import { useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, FileText, Info, Sparkles, Package, Image, Star, HelpCircle,
  Inbox, Navigation as NavIcon, FolderOpen, Phone, MessageCircle, MousePointerClick,
  Search, ScrollText, LogOut, Menu, X, PawPrint,
} from "lucide-react";

const GROUPS = [
  { title: null, items: [{ to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { title: "Website Content", items: [
    { to: "/admin/homepage", label: "Homepage", icon: FileText },
    { to: "/admin/about", label: "About", icon: Info },
    { to: "/admin/services", label: "Services", icon: Sparkles },
    { to: "/admin/packages", label: "Packages", icon: Package },
    { to: "/admin/gallery", label: "Gallery", icon: Image },
    { to: "/admin/testimonials", label: "Testimonials", icon: Star },
    { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  ] },
  { title: "Manage", items: [
    { to: "/admin/enquiries", label: "Enquiries", icon: Inbox },
    { to: "/admin/navigation", label: "Navigation", icon: NavIcon },
    { to: "/admin/media", label: "Media Library", icon: FolderOpen },
  ] },
  { title: "Settings", items: [
    { to: "/admin/contact-settings", label: "Contact Settings", icon: Phone },
    { to: "/admin/whatsapp-settings", label: "WhatsApp Settings", icon: MessageCircle },
    { to: "/admin/cta-settings", label: "CTA & Booking URL", icon: MousePointerClick },
    { to: "/admin/seo", label: "SEO", icon: Search },
  ] },
  { title: "Logs", items: [
    { to: "/admin/whatsapp-logs", label: "WhatsApp Logs", icon: MessageCircle },
    { to: "/admin/activity-logs", label: "Activity Logs", icon: ScrollText },
  ] },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = async () => { await logout(); navigate("/admin/login"); };

  const Sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/admin/dashboard" className="flex items-center gap-2 px-6 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta text-white"><PawPrint className="h-5 w-5" /></span>
        <span className="font-display text-lg font-semibold text-ink">Pawsome Admin</span>
      </Link>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {GROUPS.map((g, gi) => (
          <div key={gi}>
            {g.title && <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink/35">{g.title}</p>}
            <div className="space-y-0.5">
              {g.items.map((it) => (
                <NavLink key={it.to} to={it.to} data-testid={`sidebar-${it.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-terracotta/10 text-terracotta" : "text-ink/70 hover:bg-cream"}`}>
                  <it.icon className="h-4 w-4" /> {it.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-ink/5 p-3">
        <div className="mb-2 px-3 text-xs text-ink/50 truncate">{user?.email}</div>
        <button onClick={doLogout} data-testid="admin-logout-btn" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink/70 hover:bg-cream">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-ink/5 bg-white lg:block">{Sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white">{Sidebar}</aside>
        </div>
      )}

      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink/5 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} data-testid="admin-menu-toggle"><Menu className="h-6 w-6 text-ink" /></button>
          <span className="font-display text-lg font-medium text-ink">Pawsome Admin</span>
          <span className="w-6" />
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
