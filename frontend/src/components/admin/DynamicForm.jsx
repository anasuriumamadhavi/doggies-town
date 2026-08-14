import { useState } from "react";
import { uploadFile } from "../../lib/upload";
import { mediaUrl } from "../../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";

const inputCls = "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20";

export function DynamicForm({ schema, value, onChange, testPrefix = "field" }) {
  const set = (name, v) => onChange({ ...value, [name]: v });
  return (
    <div className="space-y-4">
      {schema.map((f) => (
        <FieldRow key={f.name} field={f} value={value[f.name]} onChange={(v) => set(f.name, v)} tid={`${testPrefix}-${f.name}`} />
      ))}
    </div>
  );
}

// Single field renderer for primitives + list types. No self-recursion.
function FieldRow({ field, value, onChange, tid }) {
  if (field.type === "switch") return <SwitchInput label={field.label} value={value} onChange={onChange} tid={tid} />;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink/80">{field.label}</label>
      <PrimitiveInput field={field} value={value} onChange={onChange} tid={tid} />
      {field.type === "string-list" && <StringList value={value || []} onChange={onChange} tid={tid} />}
      {field.type === "object-list" && <ObjectList field={field} value={value || []} onChange={onChange} tid={tid} />}
      {field.help && <p className="mt-1 text-xs text-ink/40">{field.help}</p>}
    </div>
  );
}

function PrimitiveInput({ field, value, onChange, tid }) {
  if (field.type === "text") return <input data-testid={tid} className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
  if (field.type === "number") return <input data-testid={tid} type="number" className={inputCls} value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))} />;
  if (field.type === "textarea") return <textarea data-testid={tid} rows={3} className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  if (field.type === "select") return (
    <select data-testid={tid} className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      {(field.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
  if (field.type === "image") return <ImageField value={value} onChange={onChange} tid={tid} />;
  return null;
}

function SwitchInput({ label, value, onChange, tid }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-ink/10 bg-white px-3 py-2.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <button type="button" data-testid={tid} onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-terracotta" : "bg-ink/20"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

export function ImageField({ value, onChange, tid }) {
  const [busy, setBusy] = useState(false);
  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const res = await uploadFile(file);
      onChange(res.url);
      toast.success("Uploaded");
    } catch (err) { toast.error("Upload failed"); }
    finally { setBusy(false); }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input data-testid={tid} className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="Image URL or upload" />
        <label className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink hover:bg-cream">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handle} />
        </label>
      </div>
      {value && <img src={mediaUrl(value)} alt="" className="h-24 w-auto rounded-lg object-cover" />}
    </div>
  );
}

function StringList({ value, onChange, tid }) {
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input className={inputCls} value={item} onChange={(e) => { const c = [...value]; c[i] = e.target.value; onChange(c); }} />
          <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="shrink-0 rounded-lg border border-ink/15 px-3 text-ink/50 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" data-testid={`${tid}-add`} onClick={() => onChange([...value, ""])} className="inline-flex items-center gap-1 text-sm font-medium text-terracotta"><Plus className="h-4 w-4" /> Add</button>
    </div>
  );
}

// Renders a list of objects. Each sub-field is a primitive (no nested object-list) to avoid recursion.
function ObjectList({ field, value, onChange, tid }) {
  const blank = Object.fromEntries(field.fields.map((f) => [f.name, f.type === "switch" ? false : ""]));
  const setItem = (i, name, v) => { const c = [...value]; c[i] = { ...c[i], [name]: v }; onChange(c); };
  return (
    <div className="space-y-3">
      {value.map((obj, i) => (
        <div key={i} className="rounded-lg border border-ink/10 bg-cream/50 p-3">
          <div className="mb-2 flex justify-end">
            <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="text-ink/40 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
          <div className="space-y-3">
            {field.fields.map((sf) => (
              <div key={sf.name}>
                {sf.type === "switch" ? (
                  <SwitchInput label={sf.label} value={obj[sf.name]} onChange={(v) => setItem(i, sf.name, v)} tid={`${tid}-${i}-${sf.name}`} />
                ) : (
                  <>
                    <label className="mb-1 block text-xs font-medium text-ink/70">{sf.label}</label>
                    <PrimitiveInput field={sf} value={obj[sf.name]} onChange={(v) => setItem(i, sf.name, v)} tid={`${tid}-${i}-${sf.name}`} />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" data-testid={`${tid}-add`} onClick={() => onChange([...value, { ...blank }])} className="inline-flex items-center gap-1 text-sm font-medium text-terracotta"><Plus className="h-4 w-4" /> Add</button>
    </div>
  );
}
