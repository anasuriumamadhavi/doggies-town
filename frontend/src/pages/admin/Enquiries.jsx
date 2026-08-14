import { useEffect, useState, useCallback } from "react";
import { api } from "../../lib/api";
import { useSite } from "../../context/SiteContext";
import { PageTitle, StatusBadge, Modal, AdminButton } from "../../components/admin/ui";
import { toast } from "sonner";
import { Phone, MessageCircle, Trash2, Eye } from "lucide-react";

const STATUSES = ["New", "Contacted", "Converted", "Closed"];

export default function Enquiries() {
  const { whatsappLink } = useSite();
  const [items, setItems] = useState([]);
  const [view, setView] = useState(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    const { data } = await api.get("/admin/enquiries");
    setItems(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id, status) => {
    await api.put(`/admin/enquiries/${id}/status`, { status });
    toast.success("Status updated"); await load();
    if (view?.id === id) setView((v) => ({ ...v, status }));
  };
  const del = async (id) => { await api.delete(`/admin/enquiries/${id}`); toast.success("Deleted"); setView(null); await load(); };
  const addNote = async () => {
    if (!note.trim()) return;
    const { data } = await api.post(`/admin/enquiries/${view.id}/note`, { text: note });
    setView(data); setNote(""); toast.success("Note added");
  };

  return (
    <div>
      <PageTitle title="Enquiries" subtitle="Website enquiries (not bookings)" />
      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="enquiries-table">
            <thead><tr className="border-b border-ink/5 bg-cream/50 text-xs uppercase tracking-wider text-ink/40">
              <th className="py-3 pl-4 pr-4">Name</th><th className="py-3 pr-4">Phone</th><th className="py-3 pr-4">Service</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4 text-right">Actions</th>
            </tr></thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-b border-ink/5 last:border-0" data-testid={`enquiry-row-${e.id}`}>
                  <td className="py-3 pl-4 pr-4 font-medium text-ink">{e.name}<div className="text-xs font-normal text-ink/40">{e.pet_name}</div></td>
                  <td className="py-3 pr-4 text-ink/60">{e.phone}</td>
                  <td className="py-3 pr-4 text-ink/60">{e.service || "—"}</td>
                  <td className="py-3 pr-4"><StatusBadge value={e.status} /></td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <a href={`tel:${e.phone}`} className="rounded-lg p-2 text-ink/50 hover:bg-cream"><Phone className="h-4 w-4" /></a>
                      <a href={whatsappLink(`Hi ${e.name}`)} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-ink/50 hover:bg-cream"><MessageCircle className="h-4 w-4" /></a>
                      <button onClick={() => setView(e)} data-testid={`view-enquiry-${e.id}`} className="rounded-lg p-2 text-ink/50 hover:bg-cream hover:text-terracotta"><Eye className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-ink/40">No enquiries yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!view} onClose={() => setView(null)} title="Enquiry Details" wide
        footer={<AdminButton variant="danger" onClick={() => del(view.id)} data-testid="delete-enquiry-btn"><Trash2 className="h-4 w-4" /> Delete</AdminButton>}>
        {view && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <Info label="Name" value={view.name} /><Info label="Phone" value={view.phone} />
              <Info label="Email" value={view.email || "—"} /><Info label="Pet" value={view.pet_name || "—"} />
              <Info label="Service" value={view.service || "—"} /><Info label="Package" value={view.package || "—"} />
            </div>
            <Info label="Message" value={view.message || "—"} />
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wider text-ink/40">Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => changeStatus(view.id, s)} data-testid={`status-${s}`}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${view.status === s ? "bg-terracotta text-white" : "border border-ink/15 text-ink/60"}`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wider text-ink/40">Notes</p>
              <div className="space-y-2">
                {(view.notes || []).map((n, i) => <div key={i} className="rounded-lg bg-cream p-2 text-xs text-ink/70">{n.text}</div>)}
              </div>
              <div className="mt-2 flex gap-2">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-terracotta" />
                <AdminButton variant="outline" onClick={addNote}>Add</AdminButton>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }) {
  return <div><p className="text-xs uppercase tracking-wider text-ink/40">{label}</p><p className="text-ink/80">{value}</p></div>;
}
