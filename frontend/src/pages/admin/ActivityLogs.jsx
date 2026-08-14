import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { PageTitle } from "../../components/admin/ui";

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { api.get("/admin/activity-logs").then((r) => setLogs(r.data || [])); }, []);
  return (
    <div>
      <PageTitle title="Activity Logs" subtitle="Recent admin actions" />
      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-ink/5 bg-cream/50 text-xs uppercase tracking-wider text-ink/40">
              <th className="py-3 pl-4 pr-4">Action</th><th className="py-3 pr-4">Module</th><th className="py-3 pr-4">Description</th><th className="py-3 pr-4">When</th>
            </tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-ink/5 last:border-0">
                  <td className="py-3 pl-4 pr-4 font-medium capitalize text-ink">{l.action}</td>
                  <td className="py-3 pr-4 capitalize text-ink/60">{l.module}</td>
                  <td className="py-3 pr-4 text-ink/60">{l.description}</td>
                  <td className="py-3 pr-4 text-xs text-ink/40">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-ink/40">No activity yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
