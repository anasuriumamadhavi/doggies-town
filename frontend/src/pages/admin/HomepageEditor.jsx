import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { DynamicForm } from "../../components/admin/DynamicForm";
import { PageTitle, AdminButton } from "../../components/admin/ui";
import { ICON_OPTIONS } from "../../lib/icons";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

const SIMPLE = [
  { name: "enabled", label: "Section Enabled", type: "switch" },
  { name: "heading", label: "Heading", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
];

const SECTIONS = [
  { key: "hero", title: "Hero", schema: [
    { name: "eyebrow", label: "Eyebrow", type: "text" },
    { name: "heading", label: "Heading", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "image", label: "Hero Image", type: "image" },
    { name: "video", label: "Hero Video URL", type: "text" },
    { name: "primary_cta_text", label: "Primary CTA Text", type: "text" },
    { name: "secondary_cta_text", label: "Secondary CTA Text", type: "text" },
    { name: "trust_indicators", label: "Trust Indicators", type: "string-list" },
  ] },
  { key: "introduction", title: "Introduction", schema: [
    { name: "enabled", label: "Section Enabled", type: "switch" },
    { name: "heading", label: "Heading", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "image", label: "Image", type: "image" },
    { name: "cta_text", label: "CTA Text", type: "text" },
  ] },
  { key: "services_section", title: "Services Section", schema: SIMPLE },
  { key: "why_choose_us", title: "Why Choose Us", schema: [
    ...SIMPLE,
    { name: "features", label: "Features", type: "object-list", fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "icon", label: "Icon", type: "select", options: ICON_OPTIONS.map((v) => ({ value: v, label: v })) },
    ] },
  ] },
  { key: "facility", title: "Facility", schema: [...SIMPLE, { name: "images", label: "Image URLs", type: "string-list" }] },
  { key: "journey", title: "Pet Parent Journey", schema: [
    { name: "enabled", label: "Section Enabled", type: "switch" },
    { name: "heading", label: "Heading", type: "text" },
    { name: "steps", label: "Steps", type: "object-list", fields: [
      { name: "number", label: "Number", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
    ] },
  ] },
  { key: "packages_section", title: "Packages Section", schema: SIMPLE },
  { key: "testimonials_section", title: "Testimonials Section", schema: SIMPLE },
  { key: "gallery_section", title: "Gallery Section", schema: SIMPLE },
  { key: "faq_section", title: "FAQ Section", schema: SIMPLE },
  { key: "final_cta", title: "Final CTA", schema: [
    { name: "enabled", label: "Section Enabled", type: "switch" },
    { name: "heading", label: "Heading", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "primary_cta_text", label: "Primary CTA Text", type: "text" },
  ] },
];

export default function HomepageEditor() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState("hero");
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/admin/homepage").then((r) => setData(r.data)); }, []);

  const save = async () => {
    setSaving(true);
    try { await api.put("/admin/homepage", data); toast.success("Homepage saved"); }
    catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  if (!data) return <div className="text-ink/40">Loading…</div>;

  return (
    <div className="max-w-3xl">
      <PageTitle title="Homepage" subtitle="Edit every section of your homepage"
        action={<AdminButton onClick={save} disabled={saving} data-testid="save-homepage-btn">{saving ? "Saving…" : "Save Changes"}</AdminButton>} />
      <div className="space-y-3">
        {SECTIONS.map((sec) => (
          <div key={sec.key} className="overflow-hidden rounded-2xl border border-ink/5 bg-white">
            <button onClick={() => setOpen(open === sec.key ? null : sec.key)} data-testid={`hp-section-${sec.key}`}
              className="flex w-full items-center justify-between px-5 py-4 text-left font-medium text-ink hover:bg-cream/50">
              {sec.title}
              <ChevronDown className={`h-5 w-5 text-ink/40 transition-transform ${open === sec.key ? "rotate-180" : ""}`} />
            </button>
            {open === sec.key && (
              <div className="border-t border-ink/5 px-5 py-5">
                <DynamicForm schema={sec.schema} value={data[sec.key] || {}} onChange={(v) => setData({ ...data, [sec.key]: v })} testPrefix={`hp-${sec.key}`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
