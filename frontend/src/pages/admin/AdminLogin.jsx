import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSite } from "../../context/SiteContext";
import { formatApiErrorDetail, mediaUrl } from "../../lib/api";
import { PawPrint, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const { login, user, ready } = useAuth();
  const { settings } = useSite();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (ready && user) navigate("/admin/dashboard"); }, [ready, user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await login(email, password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || "Login failed");
    } finally { setBusy(false); }
  };

  const field = "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20";

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <div className="w-full max-w-md rounded-3xl bg-cream p-8 shadow-2xl md:p-10">
        <div className="mb-8 flex items-center gap-3">
          {settings?.logo ? (
            <img src={mediaUrl(settings.logo)} alt={settings.business_name} className="h-12 w-auto" />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-terracotta text-white"><PawPrint className="h-6 w-6" /></span>
          )}
          <div>
            <h1 className="font-display text-2xl font-medium text-ink">{settings?.business_name || "Admin"}</h1>
            <p className="text-sm text-ink/50">Website management panel</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Email</label>
            <input data-testid="login-email" type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Password</label>
            <input data-testid="login-password" type="password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p data-testid="login-error" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <button type="submit" data-testid="login-submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-terracotta py-3 text-sm font-semibold uppercase tracking-wider text-white transition-all hover:-translate-y-0.5 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
