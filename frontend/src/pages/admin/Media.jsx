import { useEffect, useState, useCallback } from "react";
import { api, mediaUrl } from "../../lib/api";
import { uploadFile } from "../../lib/upload";
import { PageTitle, AdminButton } from "../../components/admin/ui";
import { toast } from "sonner";
import { Upload, Trash2, Copy, Loader2 } from "lucide-react";

export default function Media() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get("/admin/media");
    setItems(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const handle = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      for (const f of files) await uploadFile(f);
      toast.success("Uploaded"); await load();
    } catch { toast.error("Upload failed"); }
    finally { setBusy(false); }
  };

  const del = async (id) => { await api.delete(`/admin/media/${id}`); toast.success("Deleted"); await load(); };
  const copy = (url) => { navigator.clipboard.writeText(mediaUrl(url)); toast.success("URL copied"); };

  return (
    <div>
      <PageTitle title="Media Library" subtitle="Upload and manage images"
        action={<label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-terracotta px-4 py-2 text-sm font-semibold text-white hover:bg-terracotta/90">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
          <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handle} data-testid="media-upload-input" />
        </label>} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((m) => (
          <div key={m.id} className="group overflow-hidden rounded-2xl border border-ink/5 bg-white">
            <img src={mediaUrl(m.url)} alt={m.original_name} className="aspect-square w-full object-cover" />
            <div className="flex items-center justify-between p-2">
              <span className="truncate text-xs text-ink/50">{m.original_name}</span>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => copy(m.url)} className="rounded p-1 text-ink/40 hover:text-terracotta"><Copy className="h-3.5 w-3.5" /></button>
                <button onClick={() => del(m.id)} className="rounded p-1 text-ink/40 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="col-span-full py-10 text-center text-ink/40">No media uploaded yet.</p>}
      </div>
    </div>
  );
}
