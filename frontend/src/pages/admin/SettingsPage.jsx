import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useSite } from "../../context/SiteContext";
import { DynamicForm } from "../../components/admin/DynamicForm";
import { PageTitle, AdminButton } from "../../components/admin/ui";
import { toast } from "sonner";

const SCHEMAS = {
  contact: {
    title: "Contact Settings", subtitle: "Business details shown across the website",
    top: [
      { name: "business_name", label: "Business Name", type: "text" },
      { name: "logo", label: "Logo", type: "image" },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "secondary_phone", label: "Secondary Phone", type: "text" },
      { name: "whatsapp", label: "WhatsApp Number (digits only, incl. country code)", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "address", label: "Address", type: "textarea" },
      { name: "maps_embed", label: "Google Maps Embed URL", type: "textarea" },
      { name: "opening_hours", label: "Opening Hours", type: "object-list", fields: [
        { name: "day", label: "Day", type: "text" }, { name: "hours", label: "Hours", type: "text" },
      ] },
    ],
    nested: { key: "social", label: "Social Links", schema: [
      { name: "instagram", label: "Instagram URL", type: "text" },
      { name: "facebook", label: "Facebook URL", type: "text" },
      { name: "twitter", label: "Twitter/X URL", type: "text" },
    ] },
  },
  cta: {
    title: "CTA & Booking URL", subtitle: "Central Book Now configuration — used by every Book Now button",
    nested: { key: "cta", label: null, schema: [
      { name: "book_now_text", label: "Button Text", type: "text" },
      { name: "book_now_enabled", label: "Enable Book Now", type: "switch" },
      { name: "destination_type", label: "Destination Type", type: "select", options: [{ value: "erp_booking", label: "ERP/CRM Booking" }, { value: "custom", label: "Custom URL" }] },
      { name: "erp_booking_url", label: "ERP/CRM Booking URL", type: "text", help: "The standard booking URL from your ERP/CRM" },
      { name: "open_behavior", label: "Open Behaviour", type: "select", options: [{ value: "new_tab", label: "New Tab" }, { value: "same_tab", label: "Same Tab" }] },
      { name: "mobile_sticky_cta", label: "Show Mobile Sticky CTA", type: "switch" },
    ] },
  },
  whatsapp: {
    title: "WhatsApp Settings", subtitle: "Automation and default message. Provider runs in MOCK mode until credentials are added on the server.",
    nested: { key: "whatsapp_settings", label: null, schema: [
      { name: "provider", label: "Provider", type: "select", options: [{ value: "mock", label: "Mock (testing)" }, { value: "wati", label: "WATI" }, { value: "cloud", label: "WhatsApp Cloud API" }] },
      { name: "default_message", label: "Default Enquiry Message", type: "textarea" },
    ], automation: [
      { name: "booking_confirmation", label: "Booking Confirmation", type: "switch" },
      { name: "enquiry_received", label: "Enquiry Received", type: "switch" },
      { name: "booking_created", label: "Booking Created", type: "switch" },
      { name: "booking_status_update", label: "Booking Status Update", type: "switch" },
    ] },
  },
  seo: {
    title: "SEO", subtitle: "Global search & social metadata",
    nested: { key: "seo", label: null, schema: [
      { name: "title", label: "Website Title", type: "text" },
      { name: "meta_description", label: "Meta Description", type: "textarea" },
      { name: "og_image", label: "OG Image", type: "image" },
      { name: "favicon", label: "Favicon URL", type: "text" },
      { name: "analytics", label: "Analytics ID", type: "text" },
      { name: "search_console", label: "Search Console Verification", type: "text" },
    ] },
  },
};

export default function SettingsPage({ tab }) {
  const cfg = SCHEMAS[tab];
  const { reload } = useSite();
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/admin/settings").then((r) => setData(r.data)); }, [tab]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", data);
      toast.success("Settings saved");
      reload();
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  if (!data) return <div className="text-ink/40">Loading…</div>;

  const setNested = (key, v) => setData({ ...data, [key]: v });

  return (
    <div className="max-w-2xl">
      <PageTitle title={cfg.title} subtitle={cfg.subtitle}
        action={<AdminButton onClick={save} disabled={saving} data-testid="save-settings-btn">{saving ? "Saving…" : "Save Changes"}</AdminButton>} />

      <div className="space-y-6 rounded-2xl border border-ink/5 bg-white p-6">
        {cfg.top && <DynamicForm schema={cfg.top} value={data} onChange={setData} testPrefix={`settings-${tab}`} />}

        {cfg.nested && (
          <div className={cfg.top ? "border-t border-ink/5 pt-6" : ""}>
            {cfg.nested.label && <h3 className="mb-3 font-display text-lg font-medium text-ink">{cfg.nested.label}</h3>}
            <DynamicForm schema={cfg.nested.schema} value={data[cfg.nested.key] || {}} onChange={(v) => setNested(cfg.nested.key, v)} testPrefix={`settings-${tab}-nested`} />

            {cfg.nested.automation && (
              <div className="mt-6 border-t border-ink/5 pt-6">
                <h3 className="mb-3 font-display text-lg font-medium text-ink">Automation Triggers</h3>
                <DynamicForm schema={cfg.nested.automation}
                  value={data[cfg.nested.key]?.automation || {}}
                  onChange={(v) => setNested(cfg.nested.key, { ...data[cfg.nested.key], automation: v })}
                  testPrefix="settings-wa-automation" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
