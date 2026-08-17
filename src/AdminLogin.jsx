import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  LockKeyhole,
} from "lucide-react";

import { apiRequest } from "./lib/api";

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    setErr("");
    setLoading(true);
    try {
      await apiRequest("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: pw }),
      });
      nav("/admin", { replace: true });
    } catch (error) {
      setErr(error?.data?.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0e13] text-white flex items-center justify-center px-5 py-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% -10%, rgba(99,102,241,.18), transparent 34%), linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px)", backgroundSize: "auto, 48px 48px, 48px 48px" }} />

      <div className="relative w-full max-w-[430px]">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.06] flex items-center justify-center text-[11px] font-bold tracking-[0.08em]">CB</div>
          <div>
            <div className="text-sm font-bold tracking-[-0.02em]">ConsulBuzz</div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Platform Administration</div>
          </div>
        </div>

        <div className="border border-white/[0.08] bg-white/[0.035] backdrop-blur-xl rounded-[22px] p-7 sm:p-8 shadow-2xl">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-400/15 text-indigo-300 flex items-center justify-center">
            <ShieldCheck size={19} />
          </div>

          <div className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Control Center</div>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">Super Admin access</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Restricted platform access for authorized administrators only.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <div className="text-xs font-semibold text-slate-400 mb-2">Administrator email</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                autoComplete="username"
                required
                disabled={loading}
                className="w-full h-12 px-3.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </label>

            <label className="block">
              <div className="text-xs font-semibold text-slate-400 mb-2">Password</div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Enter administrator password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="w-full h-12 px-3.5 pr-11 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/5">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            {err ? (
              <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-400/15 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="mt-0.5" />
                {err}
              </div>
            ) : null}

            <button type="submit" disabled={loading} className="w-full h-12 bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-950 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? "Verifying..." : "Enter Control Center"}
              {!loading ? <ArrowRight size={15} /> : null}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.07] flex items-center justify-center gap-2 text-[11px] text-slate-600">
            <LockKeyhole size={12} />
            Administrative session protected
          </div>
        </div>
      </div>
    </div>
  );
}
