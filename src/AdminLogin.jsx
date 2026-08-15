import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { apiRequest } from "./lib/api";

export default function AdminLogin() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setErr("");
    setLoading(true);

    try {
      await apiRequest("/api/admin/auth/login", {
        method: "POST",

        body: JSON.stringify({
          email: email.trim(),
          password: pw,
        }),
      });

      nav("/admin", {
        replace: true,
      });
    } catch (error) {
      setErr(
        error?.data?.message ||
          "Unable to sign in"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
            CB
          </div>

          <div>
            <div className="text-white font-semibold">
              ConsulBuzz
            </div>

            <div className="text-xs text-slate-500 -mt-0.5">
              Super Admin
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield
              size={16}
              className="text-indigo-400"
            />

            <h1 className="text-white text-base font-semibold">
              Restricted Access
            </h1>
          </div>

          <p className="text-xs text-slate-400 mb-5">
            This portal is for ConsulBuzz staff only.
            Unauthorized access is prohibited.
          </p>

          <form
            onSubmit={submit}
            className="space-y-3"
          >
            <div>
              <label className="text-xs text-slate-400">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="admin@consulbuzz.com"
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">
                Password
              </label>

              <input
                type="password"
                value={pw}
                onChange={(e) =>
                  setPw(e.target.value)
                }
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>

            {err && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded px-2 py-1.5">
                <AlertCircle size={12} />
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded flex items-center justify-center gap-2"
            >
              {loading && (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              )}

              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            ← Back to main site
          </a>
        </div>
      </div>
    </div>
  );
}