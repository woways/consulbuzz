import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Building2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

import { apiRequest } from "./lib/api";

export default function ClientLogin() {
  const nav = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [checking, setChecking] =
    useState(true);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkExistingSession() {
      try {
        await apiRequest(
          "/api/client/auth/me"
        );

        if (active) {
          nav("/", {
            replace: true,
          });
        }
      } catch {
        // No active client session.
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    checkExistingSession();

    return () => {
      active = false;
    };
  }, [nav]);

  async function submit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiRequest(
        "/api/client/auth/login",
        {
          method: "POST",

          body: JSON.stringify({
            email: email
              .trim()
              .toLowerCase(),

            password,
          }),
        }
      );

      nav("/", {
        replace: true,
      });
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to sign in"
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2
            size={16}
            className="animate-spin"
          />

          Checking session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
            CB
          </div>

          <div>
            <div className="text-white text-lg font-semibold">
              ConsulBuzz
            </div>

            <div className="text-xs text-slate-500 -mt-0.5">
              Client Portal
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Building2
              size={17}
              className="text-indigo-400"
            />

            <h1 className="text-base font-semibold text-white">
              Sign in to your CRM
            </h1>
          </div>

          <p className="text-xs text-slate-400 mb-5">
            Use the credentials provided
            for your company account.
          </p>

          <form
            onSubmit={submit}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-medium text-slate-400">
                Email
              </label>

              <input
                type="email"
                required
                disabled={loading}
                autoComplete="username"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="admin@company.com"
                className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400">
                Password
              </label>

              <div className="relative mt-1">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  className="w-full px-3 py-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md px-3 py-2">
                <AlertCircle
                  size={14}
                  className="mt-0.5 flex-shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md flex items-center justify-center gap-2"
            >
              {loading && (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              )}

              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>
          </form>
        </div>

        <div className="text-center mt-4 text-xs text-slate-500">
          Need help accessing your
          account? Contact your ConsulBuzz
          administrator.
        </div>
      </div>
    </div>
  );
}