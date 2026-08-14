import { useState } from "react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "../../lib/api";
import { useSite } from "../../context/SiteContext";
import { Loader2 } from "lucide-react";

export function EnquiryForm({ defaultService = "", defaultPackage = "" }) {
  const { services } = useSite();
  const [form, setForm] = useState({
    name: "", phone: "", email: "", pet_name: "",
    service: defaultService, package: defaultPackage, message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    if (!form.phone.trim()) e.phone = "Please enter your phone number";
    else if (!/^[+0-9()\-\s]{7,}$/.test(form.phone)) e.phone = "Enter a valid phone number";
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post("/public/enquiries", form);
      toast.success("Thank you! We've received your enquiry and will be in touch shortly.");
      setForm({ name: "", phone: "", email: "", pet_name: "", service: "", package: "", message: "" });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Could not send enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = "w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-terracotta focus:ring-2 focus:ring-terracotta/20";

  return (
    <form onSubmit={submit} data-testid="enquiry-form" className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">Name *</label>
          <input data-testid="enquiry-name" className={field} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">Phone *</label>
          <input data-testid="enquiry-phone" type="tel" inputMode="tel" className={field} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 000 0000" />
          {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">Email</label>
          <input data-testid="enquiry-email" type="email" inputMode="email" className={field} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">Pet Name</label>
          <input data-testid="enquiry-pet" className={field} value={form.pet_name} onChange={(e) => set("pet_name", e.target.value)} placeholder="e.g. Milo" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/70">Service of interest</label>
        <select data-testid="enquiry-service" className={field} value={form.service} onChange={(e) => set("service", e.target.value)}>
          <option value="">Select a service</option>
          {services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/70">Message</label>
        <textarea data-testid="enquiry-message" rows={4} className={field} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Tell us how we can help…" />
      </div>
      <button
        type="submit"
        data-testid="enquiry-submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-terracotta px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 sm:w-auto"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Send Enquiry
      </button>
    </form>
  );
}
