import { useEffect, useState, useCallback } from "react";
import { api, mediaUrl, formatApiErrorDetail } from "../../lib/api";
import { RESOURCES } from "../../lib/adminConfig";
import { DynamicForm } from "../../components/admin/DynamicForm";
import { Modal, AdminButton, PageTitle, StatusBadge } from "../../components/admin/ui";
import { useSite } from "../../context/SiteContext";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Copy, ArrowUp, ArrowDown, Eye, EyeOff, Check } from "lucide-react";

export default function ResourcePage({ resource }) {
  const cfg = RESOURCES[resource];
  const { reload } = useSite();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get(`/admin/${resource}`);
    setItems(data || []);
    setLoading(false);
  }, [resource]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing("new"); setForm({ ...structuredClone(cfg.defaults) }); };
  const openEdit = (item) => { setEditing(item.id); setForm(structuredClone(item)); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing === "new") await api.post(`/admin/${resource}`, form);
      else await api.put(`/admin/${resource}/${editing}`, form);
      toast.success("Saved");
      setEditing(null); setForm(null);
      await load(); reload();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Save failed"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    await api.delete(`/admin/${resource}/${id}`);
    toast.success("Deleted"); setConfirmDel(null); await load(); reload();
  };

  const duplicate = async (id) => {
    await api.post(`/admin/${resource}/${id}/duplicate`);
    toast.success("Duplicated"); await load();
  };

  const togglePublish = async (item) => {
    const patch = cfg.hasStatus ? { status: item.status === "published" ? "draft" : "published" } : { published: !item.published };
    await api.put(`/admin/${resource}/${item.id}`, patch);
    await load(); reload();
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setItems(copy);
    await api.post(`/admin/${resource}/reorder`, { ids: copy.map((i) => i.id) });
    reload();
  };

  const isPub = (item) => (cfg.hasStatus ? item.status === "published" : item.published);

  return (
    <div>
      <PageTitle title={cfg.label} subtitle={`Manage your ${cfg.label.toLowerCase()}`}
        action={<AdminButton onClick={openNew} data-testid={`add-${resource}-btn`}><Plus className="h-4 w-4" /> Add {cfg.singular}</AdminButton>} />

      {loading ? <p className="text-ink/40">Loading…</p> : (
        <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid={`${resource}-table`}>
              <thead><tr className="border-b border-ink/5 bg-cream/50 text-xs uppercase tracking-wider text-ink/40">
                {cfg.canReorder && <th className="w-16 py-3 pl-4">Order</th>}
                {cfg.columns.map((c) => <th key={c.key} className="py-3 pr-4">{c.label}</th>)}
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr></thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className="border-b border-ink/5 last:border-0" data-testid={`${resource}-row-${item.id}`}>
                    {cfg.canReorder && (
                      <td className="py-3 pl-4">
                        <div className="flex flex-col">
                          <button onClick={() => move(i, -1)} className="text-ink/30 hover:text-terracotta"><ArrowUp className="h-3.5 w-3.5" /></button>
                          <button onClick={() => move(i, 1)} className="text-ink/30 hover:text-terracotta"><ArrowDown className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    )}
                    {cfg.columns.map((c) => (
                      <td key={c.key} className="py-3 pr-4">
                        {c.image ? <img src={mediaUrl(item[c.key])} alt="" className="h-12 w-16 rounded object-cover" />
                          : c.bool ? (item[c.key] ? <Check className="h-4 w-4 text-green-600" /> : <span className="text-ink/30">—</span>)
                          : c.badge ? <StatusBadge value={item[c.key]} />
                          : <span className="text-ink/80 line-clamp-1 max-w-xs">{String(item[c.key] ?? "—")}</span>}
                      </td>
                    ))}
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {(cfg.hasStatus || "published" in item) && (
                          <button onClick={() => togglePublish(item)} title="Publish/Unpublish" data-testid={`toggle-${item.id}`} className="rounded-lg p-2 text-ink/50 hover:bg-cream hover:text-terracotta">
                            {isPub(item) ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                        )}
                        {cfg.canDuplicate && <button onClick={() => duplicate(item.id)} title="Duplicate" className="rounded-lg p-2 text-ink/50 hover:bg-cream"><Copy className="h-4 w-4" /></button>}
                        <button onClick={() => openEdit(item)} title="Edit" data-testid={`edit-${item.id}`} className="rounded-lg p-2 text-ink/50 hover:bg-cream hover:text-terracotta"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setConfirmDel(item)} title="Delete" data-testid={`delete-${item.id}`} className="rounded-lg p-2 text-ink/50 hover:bg-cream hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={99} className="py-10 text-center text-ink/40">No {cfg.label.toLowerCase()} yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!editing} onClose={() => { setEditing(null); setForm(null); }} wide
        title={editing === "new" ? `Add ${cfg.singular}` : `Edit ${cfg.singular}`}
        footer={<>
          <AdminButton variant="outline" onClick={() => { setEditing(null); setForm(null); }}>Cancel</AdminButton>
          <AdminButton onClick={save} disabled={saving} data-testid="save-resource-btn">{saving ? "Saving…" : "Save"}</AdminButton>
        </>}>
        {form && <DynamicForm schema={cfg.fields} value={form} onChange={setForm} testPrefix={`${resource}-form`} />}
      </Modal>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete item?"
        footer={<>
          <AdminButton variant="outline" onClick={() => setConfirmDel(null)}>Cancel</AdminButton>
          <AdminButton variant="danger" onClick={() => del(confirmDel.id)} data-testid="confirm-delete-btn">Delete</AdminButton>
        </>}>
        <p className="text-sm text-ink/70">This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
