import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { DynamicForm } from "../../components/admin/DynamicForm";
import { PageTitle, AdminButton } from "../../components/admin/ui";
import { toast } from "sonner";

const SCHEMA = [
  { name: "hero_heading", label: "Hero Heading", type: "text" },
  { name: "hero_description", label: "Hero Description", type: "textarea" },
  { name: "hero_image", label: "Hero Image", type: "image" },
  { name: "cta_text", label: "CTA Text", type: "text" },
  { name: "sections", label: "Content Sections", type: "object-list", fields: [
    { name: "heading", label: "Heading", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "image", label: "Image", type: "image" },
    { name: "visible", label: "Visible", type: "switch" },
  ] },
];

export default function AboutEditor() {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/admin/about").then((r) => setData(r.data)); }, []);

  const save = async () => {
    setSaving(true);
    try { await api.put("/admin/about", data); toast.success("About page saved"); }
    catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  if (!data) return <div className="text-ink/40">Loading…</div>;

  return (
    <div className="max-w-3xl">
      <PageTitle title="About Page" subtitle="Manage your brand story"
        action={<AdminButton onClick={save} disabled={saving} data-testid="save-about-btn">{saving ? "Saving…" : "Save Changes"}</AdminButton>} />
      <div className="rounded-2xl border border-ink/5 bg-white p-6">
        <DynamicForm schema={SCHEMA} value={data} onChange={setData} testPrefix="about-form" />
      </div>
    </div>
  );
}
