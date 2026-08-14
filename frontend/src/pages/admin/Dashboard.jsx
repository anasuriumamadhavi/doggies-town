import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { PageTitle, StatusBadge } from "../../components/admin/ui";
import { Inbox, Sparkles, Package, Image, Star, MessageCircle, Plus } from "lucide-react";

export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/admin/dashboard").then((r) => setD(r.data)); }, []);
  if (!d) return <div className="text-ink/40">Loading…</div>;

  const stats = [
    { label: "Total Enquiries", value: d.total_enquiries, icon: Inbox },
    { label: "New Enquiries", value: d.new_enquiries, icon: Inbox },
    { label: "Active Services", value: d.active_services, icon: Sparkles },
    { label: "Active Packages", value: d.active_packages, icon: Package },
    { label: "Gallery Images", value: d.gallery_images, icon: Image },
    { label: "Testimonials", value: d.testimonials, icon: Star },
    { label: "WhatsApp Sent", value: d.whatsapp_sent, icon: MessageCircle },
    { label: "WhatsApp Failed", value: d.whatsapp_failed, icon: MessageCircle },
  ];

  const quick = [
    { to: "/admin/services", label: "Add Service", icon: Sparkles },
    { to: "/admin/packages", label: "Add Package", icon: Package },
    { to: "/admin/gallery", label: "Upload Gallery", icon: Image },
    { to: "/admin/testimonials", label: "Add Testimonial", icon: Star },
    { to: "/admin/homepage", label: "Edit Homepage", icon: Plus },
  ];

  return (
    <div>
      <PageTitle title="Dashboard" subtitle="Overview of your website" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink/5 bg-white p-5">
            <s.icon className="h-5 w-5 text-terracotta" />
            <p className="mt-3 font-display text-3xl font-semibold text-ink">{s.value}</p>
            <p className="text-xs uppercase tracking-wider text-ink/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {quick.map((q) => (
          <Link key={q.to} to={q.to} data-testid={`quick-${q.label.toLowerCase().replace(/\s+/g, "-")}`}
            className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-terracotta hover:text-terracotta">
            <q.icon className="h-4 w-4" /> {q.label}
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-ink/5 bg-white p-6">
        <h2 className="mb-4 font-display text-xl font-medium text-ink">Recent Enquiries</h2>
        {d.recent_enquiries.length === 0 ? (
          <p className="text-sm text-ink/40">No enquiries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-ink/5 text-xs uppercase tracking-wider text-ink/40">
                <th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Phone</th><th className="py-2 pr-4">Service</th><th className="py-2 pr-4">Status</th>
              </tr></thead>
              <tbody>
                {d.recent_enquiries.map((e) => (
                  <tr key={e.id} className="border-b border-ink/5">
                    <td className="py-3 pr-4 font-medium text-ink">{e.name}</td>
                    <td className="py-3 pr-4 text-ink/60">{e.phone}</td>
                    <td className="py-3 pr-4 text-ink/60">{e.service || "—"}</td>
                    <td className="py-3 pr-4"><StatusBadge value={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
