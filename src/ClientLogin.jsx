import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Check,
  LockKeyhole,
} from "lucide-react";

import { apiRequest } from "./lib/api";

export default function ClientLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkExistingSession() {
      try {
        await apiRequest("/api/client/auth/me");
        if (active) nav("/", { replace: true });
      } catch {
        // No active client session.
      } finally {
        if (active) setChecking(false);
      }
    }
    checkExistingSession();
    return () => { active = false; };
  }, [nav]);

  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      await apiRequest("/api/client/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      nav("/", { replace: true });
    } catch (error) {
      setError(error?.data?.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Checking workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-950 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden lg:flex min-h-screen p-7">
        <div className="relative w-full overflow-hidden rounded-[28px] bg-slate-950 px-10 py-10 text-white flex flex-col justify-between">
          <div className="absolute inset-0 opacity-70 pointer-events-none" style={{ background: "radial-gradient(circle at 15% 5%, rgba(99,102,241,.32), transparent 34%), radial-gradient(circle at 85% 85%, rgba(14,165,233,.18), transparent 28%)" }} />

          <div className="relative flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl border border-white/15 bg-white/10 flex items-center justify-center text-[11px] font-bold tracking-[0.08em]">CB</div>
            <div>
              <div className="text-sm font-bold tracking-[-0.02em]">ConsulBuzz</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Workspace</div>
            </div>
          </div>

          <div className="relative max-w-xl py-16">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">Your daily operating workspace</div>
            <h1 className="mt-5 text-[44px] leading-[1.05] font-semibold tracking-[-0.045em]">
              One clear view of leads, admissions and performance.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-slate-400">
              Sign in to your company workspace and continue exactly where your team left off.
            </p>

            <div className="mt-8 space-y-3">
              {["Role-based workspace access", "Live business data", "Secure company session"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-5 h-5 rounded-full border border-white/10 bg-white/5 flex items-center justify-center"><Check size={11} /></div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative text-[11px] text-slate-500">Client workspace access</div>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[430px]">
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center text-[11px] font-bold">CB</div>
            <div className="text-sm font-bold">ConsulBuzz</div>
          </div>

          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Client sign in</div>
          <h2 className="mt-3 text-[32px] font-semibold tracking-[-0.04em] text-slate-950">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Enter the credentials assigned to your company account.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <div className="text-xs font-semibold text-slate-600 mb-2">Work email</div>
              <input
                type="email"
                required
                disabled={loading}
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                className="w-full h-12 px-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-950 placeholder-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-600">Password</div>
                <div className="text-[11px] text-slate-400">Secure sign in</div>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 px-3.5 pr-11 bg-white border border-slate-200 rounded-xl text-sm text-slate-950 placeholder-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            {error ? (
              <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <button type="submit" disabled={loading} className="w-full h-12 bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(15,23,42,0.12)] transition-all">
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign in to workspace"}
              {!loading ? <ArrowRight size={15} /> : null}
            </button>
          </form>

          <div className="mt-7 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <LockKeyhole size={12} />
            Protected company workspace
          </div>
        </div>
      </section>
    </div>
  );
}
