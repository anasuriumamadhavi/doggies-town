import { useEffect, useState, useCallback } from "react";
import { api } from "../../lib/api";
import { PageTitle, StatusBadge, AdminButton } from "../../components/admin/ui";
import { toast } from "sonner";
import { RefreshCw, Send } from "lucide-react";

export default function WhatsAppLogs() {
  const [logs, setLogs] = useState([]);
  const [testPhone, setTestPhone] = useState("");

  const load = useCallback(async () => {
    const { data } = await api.get("/admin/whatsapp/logs");
    setLogs(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const retry = async (id) => {
    const { data } = await api.post(`/admin/whatsapp/logs/${id}/retry`);
    if (data.success) toast.success("Message re-sent"); else toast.error(data.error || "Retry failed");
    await load();
  };
  const test = async () => {
    const { data } = await api.post("/admin/whatsapp/test", { phone: testPhone });
    if (data.skipped) toast.info("Duplicate skipped"); else if (data.status === "sent") toast.success("Test message sent (mock)"); else toast.error(data.error || "Failed");
    await load();
  };

  return (
    <div>
      <PageTitle title="WhatsApp Logs" subtitle="Message delivery status. Provider runs in MOCK mode."
        action={<div className="flex gap-2">
          <input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="Test phone" className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-terracotta" />
          <AdminButton onClick={test} data-testid="wa-test-btn"><Send className="h-4 w-4" /> Send Test</AdminButton>
        </div>} />
      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="wa-logs-table">
            <thead><tr className="border-b border-ink/5 bg-cream/50 text-xs uppercase tracking-wider text-ink/40">
              <th className="py-3 pl-4 pr-4">Customer</th><th className="py-3 pr-4">Phone</th><th className="py-3 pr-4">Type</th><th className="py-3 pr-4">Trigger</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">When</th><th className="py-3 pr-4 text-right">Actions</th>
            </tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-ink/5 last:border-0">
                  <td className="py-3 pl-4 pr-4 font-medium text-ink">{l.customer_name}</td>
                  <td className="py-3 pr-4 text-ink/60">{l.phone}</td>
                  <td className="py-3 pr-4 text-ink/60">{l.message_type}</td>
                  <td className="py-3 pr-4 text-ink/60">{l.trigger}</td>
                  <td className="py-3 pr-4"><StatusBadge value={l.status} />{l.error && <div className="text-xs text-destructive">{l.error}</div>}</td>
                  <td className="py-3 pr-4 text-xs text-ink/40">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="py-3 pr-4 text-right">
                    {l.status === "failed" && <button onClick={() => retry(l.id)} data-testid={`retry-${l.id}`} className="inline-flex items-center gap-1 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium hover:bg-cream"><RefreshCw className="h-3.5 w-3.5" /> Retry</button>}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-ink/40">No messages yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
