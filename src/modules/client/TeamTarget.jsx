import { useEffect, useMemo, useRef, useState } from "react";

import {
  Loader2,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Target as TargetIcon,
  Users,
} from "lucide-react";

import { apiRequest } from "../../lib/api";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function monthKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function initialsOf(name) {
  return String(name || "?").split(" ").filter(Boolean).slice(0, 2)
    .map((p) => p[0]).join("").toUpperCase();
}

const STATUS_STYLES = {
  DONE: "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-600",
  NOT_STARTED: "bg-pink-100 text-pink-600",
};
const STATUS_LABEL = {
  DONE: "✓ Done",
  IN_PROGRESS: "◐ In progress",
  NOT_STARTED: "○ Not started",
};

// Segmented ring: build the 4 week arcs.
const RING_CIRC = 326.7; // 2π·52
const WEEK_COLORS = ["#fde047", "#7dd3fc", "#a5b4fc", "#f9a8d4", "#c4b5fd"];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function TeamTarget({ currentUser }) {
  const isAdmin =
    currentUser?.role === "CLIENT_ADMIN" ||
    currentUser?.permissions?.canViewTeamTargets === true;

  const [view, setView] = useState("me"); // "me" | "team"
  const [month, setMonth] = useState(() => monthKey(new Date()));

  // My page data
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Admin data
  const [roster, setRoster] = useState([]);
  const [teamAverage, setTeamAverage] = useState(0);
  const [teamLoading, setTeamLoading] = useState(false);
  const [drillUser, setDrillUser] = useState(null); // {owner, tasks, analytics}

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const [displayPct, setDisplayPct] = useState(0);
  const animRef = useRef(null);

  /* ---- Load my page ---------------------------------------------- */
  async function loadMe() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(
        `/api/client/targets/me?month=${month}`
      );
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      setAnalytics(data.analytics || null);
    } catch (err) {
      setError(err?.data?.message || "Unable to load your targets");
    } finally {
      setLoading(false);
    }
  }

  async function loadTeam() {
    setTeamLoading(true);
    setError("");
    try {
      const data = await apiRequest(
        `/api/client/targets/team?month=${month}`
      );
      setRoster(Array.isArray(data.roster) ? data.roster : []);
      setTeamAverage(Number(data.teamAverage || 0));
    } catch (err) {
      setError(err?.data?.message || "Unable to load team targets");
    } finally {
      setTeamLoading(false);
    }
  }

  async function loadDrill(userId) {
    setError("");
    try {
      const data = await apiRequest(
        `/api/client/targets/user/${userId}?month=${month}`
      );
      setDrillUser({
        owner: data.owner,
        tasks: Array.isArray(data.tasks) ? data.tasks : [],
        analytics: data.analytics || null,
      });
    } catch (err) {
      setError(err?.data?.message || "Unable to load user");
    }
  }

  useEffect(() => {
    if (view === "me") loadMe();
    else if (view === "team") loadTeam();
    setDrillUser(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, month]);

  /* ---- Animate the month ring ------------------------------------ */
  const activeAnalytics = drillUser ? drillUser.analytics : analytics;
  const targetPct = activeAnalytics?.monthPercent || 0;

  useEffect(() => {
    if (animRef.current) clearInterval(animRef.current);
    setDisplayPct(0);
    let cur = 0;
    animRef.current = setInterval(() => {
      cur += 2;
      if (cur >= targetPct) {
        cur = targetPct;
        clearInterval(animRef.current);
      }
      setDisplayPct(cur);
    }, 28);
    return () => clearInterval(animRef.current);
  }, [targetPct, view, drillUser]);

  /* ---- Task actions ---------------------------------------------- */
  async function addTask() {
    const title = newTitle.trim();
    if (!title || adding) return;
    setAdding(true);
    try {
      await apiRequest("/api/client/targets", {
        method: "POST",
        body: JSON.stringify({ title, date: todayStr(), type: "CHECKLIST" }),
      });
      setNewTitle("");
      await loadMe();
    } catch (err) {
      setError(err?.data?.message || "Unable to add task");
    } finally {
      setAdding(false);
    }
  }

  async function setStatus(task, status) {
    try {
      await apiRequest(`/api/client/targets/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadMe();
    } catch (err) {
      setError(err?.data?.message || "Unable to update task");
    }
  }

  async function deleteTask(task) {
    if (!window.confirm("Delete this task?")) return;
    try {
      await apiRequest(`/api/client/targets/${task.id}`, { method: "DELETE" });
      await loadMe();
    } catch (err) {
      setError(err?.data?.message || "Unable to delete task");
    }
  }

  /* ---- Month options (current year) ------------------------------ */
  const monthOptions = useMemo(() => {
    const now = new Date();
    const opts = [];
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      opts.push({ key: monthKey(d), label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
    }
    return opts;
  }, []);

  const weeks = activeAnalytics?.weeks || [];

  /* ---- Segmented ring geometry ----------------------------------- */
  const ringSegments = useMemo(() => {
    // Each week's arc length is proportional to its share of the month total.
    // For a clean visual we scale each week's percent to a slice of the ring
    // sized by (weekPercent / sumOfWeekPercents) * (monthPercent/100 * circ).
    const totalWeekPct = weeks.reduce((a, w) => a + (w.percent || 0), 0);
    const filled = (targetPct / 100) * RING_CIRC;
    let offset = 0;
    return weeks.map((w, i) => {
      const share = totalWeekPct > 0 ? (w.percent || 0) / totalWeekPct : 0;
      const len = share * filled;
      const seg = {
        color: WEEK_COLORS[i % WEEK_COLORS.length],
        dasharray: `${len.toFixed(1)} ${(RING_CIRC - len).toFixed(1)}`,
        dashoffset: (-offset).toFixed(1),
        label: `Week ${w.week} · ${w.percent}%`,
      };
      offset += len;
      return seg;
    });
  }, [weeks, targetPct]);

  const [hoverLabel, setHoverLabel] = useState(null);

  /* ---- Sub-renderers --------------------------------------------- */

  function ProgressCard(a, ownerName) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-600 to-brand-900 p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-200">
            {monthOptions.find((m) => m.key === month)?.label || "Progress"}
            {ownerName ? ` · ${ownerName}` : ""}
          </div>
          <div className="text-[11px] text-brand-200">Hover a week</div>
        </div>
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="relative h-44 w-44 flex-shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" />
              {ringSegments.map((seg, i) => (
                <circle
                  key={i}
                  cx="60" cy="60" r="52" fill="none"
                  stroke={seg.color} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={seg.dasharray}
                  strokeDashoffset={seg.dashoffset}
                  style={{ cursor: "pointer", transition: "opacity .2s" }}
                  onMouseOver={() => setHoverLabel(seg.label)}
                  onMouseOut={() => setHoverLabel(null)}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[32px] font-black leading-none">
                {hoverLabel ? hoverLabel.split("· ")[1] : `${displayPct}%`}
              </div>
              <div className="text-[10px] font-semibold text-brand-200">
                {hoverLabel ? hoverLabel.split(" ·")[0] : "achieved"}
              </div>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:max-w-[300px]">
            {weeks.map((w, i) => (
              <div key={w.week} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5">
                <span className="h-3 w-3 rounded-full" style={{ background: WEEK_COLORS[i % WEEK_COLORS.length] }} />
                <span className="text-[12px] font-semibold">Week {w.week} · {w.percent}%</span>
              </div>
            ))}
            {weeks.length === 0 && (
              <div className="col-span-2 text-[12px] text-brand-200">No data for this month yet.</div>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-[11px]">
          <span className="text-brand-100">Not achieved</span>
          <span className="font-bold text-rose-200">{a?.notAchievedPercent ?? 100}%</span>
        </div>
      </div>
    );
  }

  function TaskList(list, editable) {
    if (!list.length) {
      return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-xs text-slate-500">
          No tasks for this month yet.
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {list.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <span className="flex-1 text-sm font-semibold text-slate-800">
              {t.title}
              {t.source === "ASSIGNED" && (
                <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-bold text-brand-600">
                  Assigned
                </span>
              )}
            </span>
            {editable ? (
              <>
                {["DONE", "IN_PROGRESS", "NOT_STARTED"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(t, s)}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      t.status === s ? STATUS_STYLES[s] : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
                {t.source === "SELF" && (
                  <button
                    type="button"
                    onClick={() => deleteTask(t)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </>
            ) : (
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${STATUS_STYLES[t.status]}`}>
                {STATUS_LABEL[t.status]}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  /* ---- Render ---------------------------------------------------- */

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-500">
            Performance
          </div>
          <h1 className="flex items-center gap-2 text-[22px] font-black tracking-[-0.03em] text-slate-950">
            <TargetIcon size={20} className="text-brand-600" />
            Team Target
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setView("me")}
                className={`rounded-lg px-4 py-2 text-xs font-bold ${
                  view === "me" ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                My Page
              </button>
              <button
                type="button"
                onClick={() => setView("team")}
                className={`rounded-lg px-4 py-2 text-xs font-bold ${
                  view === "team" ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Team View
              </button>
            </div>
          )}

          <div className="flex h-9 items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            <span className="border-r border-slate-200 px-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Month
            </span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-full bg-transparent px-3 text-xs font-semibold text-slate-700 outline-none"
            >
              {monthOptions.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ---- MY PAGE ---- */}
      {view === "me" && (
        loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : (
          <>
            {ProgressCard(analytics, null)}

            {/* Today's update / add */}
            <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/40 p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-slate-900">Your tasks</div>
                  <div className="text-[11px] text-slate-500">Mark each task done or in progress</div>
                </div>
              </div>
              <div className="mb-3 flex items-center gap-2">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
                  placeholder="Add a task for today..."
                  className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand-400"
                />
                <button
                  type="button"
                  onClick={addTask}
                  disabled={adding || !newTitle.trim()}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Add
                </button>
              </div>
              {TaskList(tasks, true)}
            </div>
          </>
        )
      )}

      {/* ---- TEAM VIEW ---- */}
      {view === "team" && isAdmin && (
        drillUser ? (
          <>
            <button
              type="button"
              onClick={() => setDrillUser(null)}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              <ChevronLeft size={14} /> Back to team
            </button>
            {ProgressCard(drillUser.analytics, drillUser.owner?.name)}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 text-sm font-black text-slate-900">
                {drillUser.owner?.name}'s tasks
              </div>
              {TaskList(drillUser.tasks, false)}
            </div>
          </>
        ) : teamLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-500 to-brand-600 p-4 text-white shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wide text-white/70">Team average</div>
                <div className="mt-1 text-[28px] font-black">{teamAverage}%</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Members</div>
                <div className="mt-1 text-[28px] font-black text-slate-900">{roster.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Top performer</div>
                <div className="mt-1 text-sm font-black text-emerald-600">
                  {roster.length ? `${[...roster].sort((a,b)=>b.percent-a.percent)[0].name} — ${[...roster].sort((a,b)=>b.percent-a.percent)[0].percent}%` : "—"}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              {roster.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => loadDrill(r.id)}
                  className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-xs font-black text-white">
                    {initialsOf(r.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-slate-900">{r.name}</div>
                    <div className="text-[11px] text-slate-500">{r.jobTitle || r.email}</div>
                  </div>
                  <div className="hidden w-48 sm:block">
                    <div className="h-2.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
                        style={{ width: `${r.percent}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-right text-sm font-black text-brand-600">{r.percent}%</span>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
              ))}
              {roster.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-slate-500">No employees found.</div>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
