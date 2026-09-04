import { Fragment, useEffect, useMemo, useState } from "react";

import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Target as TargetIcon,
  Minus,
  Plus,
  Search,
  X,
  Filter,
} from "lucide-react";

import TeamTargetAll from "./TeamTargetAll";

import { apiRequest } from "../../lib/api";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTH_ABBR = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
];

function initialsOf(name) {
  return String(name || "?").split(" ").filter(Boolean).slice(0, 2)
    .map((p) => p[0]).join("").toUpperCase();
}

const LAUNCH_YEAR = 2026;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function TeamTarget({ currentUser }) {
  const isAdmin =
    currentUser?.role === "CLIENT_ADMIN" ||
    currentUser?.permissions?.canViewTeamTargets === true;

  const currentYear = new Date().getFullYear();

  const [view, setView] = useState("me"); // "me" | "team"
  const [showAll, setShowAll] = useState(false);
  const [year, setYear] = useState(Math.max(LAUNCH_YEAR, currentYear));

  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [roster, setRoster] = useState([]);
  const [rosterSearch, setRosterSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState([]); // selected departments
  const [deptOpen, setDeptOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState([]); // selected roles
  const [roleOpen, setRoleOpen] = useState(false);
  const [teamAverage, setTeamAverage] = useState(0);
  const [teamLoading, setTeamLoading] = useState(false);
  const [drill, setDrill] = useState(null);

  const yearOptions = useMemo(() => {
    const start = Math.max(LAUNCH_YEAR, currentYear);
    const arr = [];
    for (let y = start + 2; y >= LAUNCH_YEAR; y -= 1) arr.push(y);
    return arr;
  }, [currentYear]);

  /* ---- Load ------------------------------------------------------ */
  async function loadMe() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(`/api/client/targets/me?year=${year}`);
      setMonths(Array.isArray(data.months) ? data.months : []);
    } catch (err) {
      setError(err?.data?.message || "Unable to load targets");
    } finally {
      setLoading(false);
    }
  }
  async function loadTeam() {
    setTeamLoading(true);
    setError("");
    try {
      const data = await apiRequest(`/api/client/targets/team?year=${year}`);
      setRoster(Array.isArray(data.roster) ? data.roster : []);
      setTeamAverage(Number(data.teamAverage || 0));
    } catch (err) {
      setError(err?.data?.message || "Unable to load team");
    } finally {
      setTeamLoading(false);
    }
  }
  async function loadDrill(userId) {
    setError("");
    try {
      const data = await apiRequest(
        `/api/client/targets/user/${userId}?year=${year}`
      );
      setDrill({
        owner: data.owner,
        months: Array.isArray(data.months) ? data.months : [],
      });
    } catch (err) {
      setError(err?.data?.message || "Unable to load user");
    }
  }

  useEffect(() => {
    if (view === "me") loadMe();
    else loadTeam();
    setDrill(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, year]);

  /* ---- Actions --------------------------------------------------- */
  async function setAchieved(month, week, value) {
    const v = Math.max(0, value);
    try {
      const data = await apiRequest("/api/client/targets/me/achieved", {
        method: "PATCH",
        body: JSON.stringify({ year, month, week, value: v }),
      });
      setMonths((cur) => cur.map((m) => (m.month === month ? data.target : m)));
    } catch (err) {
      setError(err?.data?.message || "Unable to save");
    }
  }

  async function setTargetValue(ownerId, month, scope, week, value) {
    const v = Math.max(0, Number(value) || 0);
    try {
      const body = { ownerId, year, month, scope, value: v };
      if (scope === "week") body.week = week;
      const data = await apiRequest("/api/client/targets/target", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setDrill((d) =>
        d
          ? { ...d, months: d.months.map((m) => (m.month === month ? data.target : m)) }
          : d
      );
    } catch (err) {
      setError(err?.data?.message || "Unable to set target");
    }
  }

  const ROLE_LABELS = {
    CLIENT_ADMIN: "Client Admin",
    MANAGER: "Manager",
    EMPLOYEE: "Employee",
  };

  // Fixed role set (roles are a known list, not derived from data).
  const roles = ["CLIENT_ADMIN", "MANAGER", "EMPLOYEE"];

  function toggleRole(x) {
    setRoleFilter((cur) => (cur.includes(x) ? cur.filter((y) => y !== x) : [...cur, x]));
  }

  const departments = useMemo(() => {
    const set = new Set();
    roster.forEach((r) => {
      const d = String(r.department || "").trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [roster]);

  const filteredRoster = useMemo(() => {
    let list = roster;
    if (deptFilter.length > 0) {
      list = list.filter((r) => deptFilter.includes(String(r.department || "").trim()));
    }
    if (roleFilter.length > 0) {
      list = list.filter((r) => roleFilter.includes(r.role));
    }
    const q = rosterSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.name, r.email, r.department, r.id]
          .some((v) => String(v || "").toLowerCase().includes(q))
      );
    }
    return list;
  }, [roster, deptFilter, roleFilter, rosterSearch]);

  function toggleDept(d) {
    setDeptFilter((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]
    );
  }

  /* ---- Derived: year average for the ring ------------------------ */
  function yearAverage(monthRows) {
    const vals = monthRows
      .filter((m) => m.monthlyTarget > 0)
      .map((m) => m.overallPercent);
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  function bestMonth(monthRows) {
    const withT = monthRows.filter((m) => m.monthlyTarget > 0);
    if (!withT.length) return null;
    return [...withT].sort((a, b) => b.overallPercent - a.overallPercent)[0];
  }

  /* ---- UI bits --------------------------------------------------- */

  function pctPill(p) {
    const cls =
      p >= 100
        ? "bg-emerald-50 text-emerald-600"
        : p > 0
        ? "bg-amber-50 text-amber-600"
        : "bg-slate-100 text-slate-400";
    return (
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>
        {p}%
      </span>
    );
  }

  // Glassy analysis ring card.
  function AnalysisCard(monthRows, name) {
    const avg = yearAverage(monthRows);
    const best = bestMonth(monthRows);
    const tracked = monthRows.filter((m) => m.monthlyTarget > 0).length;
    const circ = 326.7;
    const shown = Math.min(100, avg);
    const offset = circ - (circ * shown) / 100;

    return (
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-white shadow-[0_2px_4px_rgba(16,24,40,.04),0_16px_40px_rgba(79,70,229,.20)]">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-200">
            {name ? `${name} · ` : ""}{year} year average
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-brand-100">
            {year === LAUNCH_YEAR ? "Sept–Dec active" : "Full year"}
          </div>
        </div>
        <div className="mt-5 flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
          <div className="relative h-44 w-44 flex-shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="14" />
              <circle
                cx="60" cy="60" r="52" fill="none" stroke="#fde047" strokeWidth="14"
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1s ease", filter: "drop-shadow(0 2px 6px rgba(253,224,71,.4))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[38px] font-black leading-none tracking-tight">{avg}%</div>
              <div className="text-[11px] font-semibold text-brand-200">year avg</div>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 sm:max-w-[360px]">
            <div className="rounded-2xl bg-white/[0.08] p-4">
              <div className="text-[9px] font-bold uppercase tracking-wide text-brand-200">Months tracked</div>
              <div className="mt-1 text-[22px] font-black">{tracked}</div>
            </div>
            <div className="rounded-2xl bg-white/[0.08] p-4">
              <div className="text-[9px] font-bold uppercase tracking-wide text-brand-200">Best month</div>
              <div className="mt-1 text-[16px] font-black">
                {best ? `${MONTH_ABBR[best.month - 1]} · ${best.overallPercent}%` : "—"}
              </div>
            </div>
            <div className="col-span-2 rounded-2xl bg-white/[0.08] p-4">
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold text-brand-200">
                <span>Progress</span>
                <span className="font-black">{avg}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400"
                  style={{ width: `${Math.min(100, avg)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // The premium table. mode: "achieved" | "target" | "none"
  function TargetTable(monthRows, mode, ownerId) {
    const maxWeeks = monthRows.reduce((mx, m) => Math.max(mx, m.weeks.length), 4);
    const weekIdx = Array.from({ length: maxWeeks }, (_, i) => i + 1);

    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(16,24,40,.04),0_8px_24px_rgba(16,24,40,.05)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center text-[12px]">
            <thead>
              <tr className="text-slate-500">
                <th className="bg-slate-50/80 px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider" rowSpan={2}>
                  Month
                </th>
                <th className="bg-slate-50/80 px-3 py-3.5 text-[10px] font-bold uppercase tracking-wider" rowSpan={2}>
                  Monthly<br />Target
                </th>
                {weekIdx.map((w) => (
                  <th key={`w${w}`} className="border-l border-slate-100 bg-slate-50/80 px-2 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600" colSpan={3}>
                    Week {w}
                  </th>
                ))}
                <th className="border-l border-slate-100 bg-brand-50/70 px-3 py-3.5 text-[10px] font-bold uppercase tracking-wider text-brand-600" rowSpan={2}>
                  Overall<br />Conv%
                </th>
              </tr>
              <tr className="text-[9px] uppercase tracking-wide text-slate-400">
                {weekIdx.map((w) => (
                  <Fragment key={`h${w}`}>
                    <th className="border-l border-slate-100 bg-slate-50/50 px-2 py-2 font-semibold">Target</th>
                    <th className="bg-slate-50/50 px-2 py-2 font-semibold">Achieved</th>
                    <th className="bg-slate-50/50 px-2 py-2 font-semibold">Conv%</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthRows.map((m) => (
                <tr key={m.month} className="transition-colors hover:bg-[#fafbff]">
                  {/* Month */}
                  <td className="px-4 py-4 text-left">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-[11px] font-black text-brand-600">
                        {MONTH_ABBR[m.month - 1]}
                      </span>
                      <div>
                        <div className="font-black text-slate-800">{MONTH_NAMES[m.month - 1]}</div>
                        <div className="text-[10px] font-medium text-slate-400">{year}</div>
                      </div>
                    </div>
                  </td>

                  {/* Monthly target — admin types it directly */}
                  <td className="px-3 py-4">
                    {mode === "target" ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        defaultValue={m.monthlyTarget}
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(/[^0-9]/g, "");
                        }}
                        onBlur={(e) =>
                          setTargetValue(ownerId, m.month, "monthly", null, e.target.value)
                        }
                        className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-[14px] font-black text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      />
                    ) : (
                      <span className="text-[15px] font-black text-slate-800">{m.monthlyTarget}</span>
                    )}
                  </td>

                  {/* Weeks */}
                  {weekIdx.map((wnum) => {
                    const w = m.weeks.find((x) => x.week === wnum);
                    if (!w) {
                      return (
                        <Fragment key={`e${wnum}`}>
                          <td className="border-l border-slate-50 bg-slate-50/40" />
                          <td className="bg-slate-50/40" />
                          <td className="bg-slate-50/40" />
                        </Fragment>
                      );
                    }
                    return (
                      <Fragment key={`c${wnum}`}>
                        {/* Target */}
                        <td className="border-l border-slate-50 px-2 py-4">
                          {mode === "target" ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              defaultValue={w.target}
                              onInput={(e) => {
                                e.target.value = e.target.value.replace(/[^0-9]/g, "");
                              }}
                              onBlur={(e) => setTargetValue(ownerId, m.month, "week", wnum, e.target.value)}
                              className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-[13px] font-black text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                            />
                          ) : (
                            <span className="font-semibold text-slate-500">{w.target}</span>
                          )}
                        </td>
                        {/* Achieved */}
                        <td className="px-2 py-4">
                          {mode === "achieved" ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setAchieved(m.month, wnum, w.achieved - 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-7 text-center text-[14px] font-black text-slate-900">
                                {w.achieved}
                              </span>
                              <button
                                type="button"
                                onClick={() => setAchieved(m.month, wnum, w.achieved + 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[14px] font-black text-slate-900">{w.achieved}</span>
                          )}
                        </td>
                        {/* Conv% */}
                        <td className="px-2 py-4">{pctPill(w.percent)}</td>
                      </Fragment>
                    );
                  })}

                  {/* Overall */}
                  <td className="border-l border-slate-50 bg-brand-50/40 px-3 py-4">
                    <span
                      className={`text-[15px] font-black ${
                        m.overallPercent >= 100 ? "text-emerald-600" : "text-brand-700"
                      }`}
                    >
                      {m.overallPercent}%
                    </span>
                  </td>
                </tr>
              ))}
              {/* Total year — auto, read-only */}
              {(() => {
                const totalMonthly = monthRows.reduce((s, m) => s + (m.monthlyTarget || 0), 0);
                const totalAchieved = monthRows.reduce((s, m) => s + (m.totalAchieved || 0), 0);
                const totalPct = totalMonthly > 0 ? Math.round((totalAchieved / totalMonthly) * 100) : 0;
                return (
                  <tr className="border-t-2 border-slate-200 bg-slate-50/70">
                    <td className="px-4 py-4 text-left text-[13px] font-black uppercase tracking-wide text-slate-700">
                      Total year
                    </td>
                    <td className="px-3 py-4 text-[15px] font-black text-slate-900">{totalMonthly}</td>
                    {weekIdx.map((w) => (
                      <Fragment key={`tf${w}`}>
                        <td className="border-l border-slate-100 bg-slate-50/70" />
                        <td className="bg-slate-50/70" />
                        <td className="bg-slate-50/70" />
                      </Fragment>
                    ))}
                    <td className="border-l border-slate-100 bg-brand-100/50 px-3 py-4">
                      <span className={`text-[16px] font-black ${totalPct >= 100 ? "text-emerald-600" : "text-brand-700"}`}>
                        {totalPct}%
                      </span>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ---- Render ---------------------------------------------------- */

  if (showAll) {
    return <TeamTargetAll onBack={() => setShowAll(false)} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-500">
            Performance
          </div>
          <h1 className="flex items-center gap-2 text-[24px] font-black tracking-[-0.03em] text-slate-900">
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
                  view === "me" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                My Page
              </button>
              <button
                type="button"
                onClick={() => setView("team")}
                className={`rounded-lg px-4 py-2 text-xs font-bold ${
                  view === "team" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                Team View
              </button>
            </div>
          )}
          <div className="flex h-10 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <span className="border-r border-slate-100 px-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Year
            </span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-full bg-transparent px-3 text-[13px] font-semibold text-slate-700 outline-none"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
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

      {/* MY PAGE */}
      {view === "me" && (
        loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : (
          <>
            {AnalysisCard(months, null)}
            <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-2.5 text-[12px] font-semibold text-brand-700">
              Use − / + to record what you achieved each week. Targets and percentages are automatic.
            </div>
            {TargetTable(months, "achieved", currentUser?.id)}
          </>
        )
      )}

      {/* TEAM VIEW */}
      {view === "team" && isAdmin && (
        drill ? (
          <>
            <button
              type="button"
              onClick={() => setDrill(null)}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              <ChevronLeft size={14} /> Back to team
            </button>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-xs font-black text-white">
                {initialsOf(drill.owner?.name)}
              </span>
              <div>
                <div className="text-sm font-black text-slate-900">{drill.owner?.name}</div>
                <div className="text-[11px] text-slate-500">{drill.owner?.jobTitle || drill.owner?.email}</div>
              </div>
            </div>
            {AnalysisCard(drill.months, drill.owner?.name)}
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12px] font-semibold text-amber-700">
              Type each <b>Week Target</b> (numbers only). Monthly Target = sum of week targets. Achieved is entered by the employee.
            </div>
            {TargetTable(drill.months, "target", drill.owner?.id)}
          </>
        ) : teamLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-semibold text-slate-500">Company-wide performance overview</div>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800"
              >
                View all
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-5 text-white shadow-[0_8px_24px_rgba(79,70,229,.18)]">
                <div className="text-[10px] font-bold uppercase tracking-wide text-brand-200">Team average · {year}</div>
                <div className="mt-1 text-[30px] font-black">{teamAverage}%</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Members</div>
                <div className="mt-1 text-[30px] font-black text-slate-900">{roster.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Top performer</div>
                <div className="mt-1 text-sm font-black text-emerald-600">
                  {roster.length
                    ? `${[...roster].sort((a,b)=>b.yearAveragePercent-a.yearAveragePercent)[0].name} — ${[...roster].sort((a,b)=>b.yearAveragePercent-a.yearAveragePercent)[0].yearAveragePercent}%`
                    : "—"}
                </div>
              </div>
            </div>

            {/* Search + department filter */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
              <div className="relative min-w-[220px] flex-1">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Search by name, email, id or department"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 text-xs font-medium text-slate-700 outline-none focus:border-brand-400 focus:bg-white"
                />
                {rosterSearch && (
                  <button
                    type="button"
                    onClick={() => setRosterSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDeptOpen((o) => !o)}
                  className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold ${
                    deptFilter.length ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Filter size={13} />
                  Department{deptFilter.length ? ` · ${deptFilter.length}` : ""}
                </button>

                {deptOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close"
                      onClick={() => setDeptOpen(false)}
                      className="fixed inset-0 z-[10] cursor-default"
                    />
                    <div className="absolute right-0 top-11 z-[20] max-h-64 w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                      {departments.length === 0 ? (
                        <div className="px-3 py-4 text-center text-[11px] text-slate-400">
                          No departments set on employees.
                        </div>
                      ) : (
                        <>
                          {departments.map((d) => {
                            const on = deptFilter.includes(d);
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => toggleDept(d)}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12px] font-semibold ${
                                  on ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {d}
                                <span className={`flex h-4 w-4 items-center justify-center rounded border ${on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"}`}>
                                  {on && <span className="text-[9px] font-black">✓</span>}
                                </span>
                              </button>
                            );
                          })}
                          {deptFilter.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setDeptFilter([])}
                              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                            >
                              Clear filter
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleOpen((o) => !o)}
                  className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold ${
                    roleFilter.length ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Filter size={13} />
                  Role{roleFilter.length ? ` · ${roleFilter.length}` : ""}
                </button>
                {roleOpen && (
                  <>
                    <button type="button" aria-label="Close" onClick={() => setRoleOpen(false)} className="fixed inset-0 z-[10] cursor-default" />
                    <div className="absolute right-0 top-11 z-[20] w-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                      {roles.length === 0 ? (
                        <div className="px-3 py-4 text-center text-[11px] text-slate-400">No roles found.</div>
                      ) : (
                        <>
                          {roles.map((x) => {
                            const on = roleFilter.includes(x);
                            return (
                              <button key={x} type="button" onClick={() => toggleRole(x)}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12px] font-semibold ${on ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"}`}>
                                {ROLE_LABELS[x] || x}
                                <span className={`flex h-4 w-4 items-center justify-center rounded border ${on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"}`}>
                                  {on && <span className="text-[9px] font-black">✓</span>}
                                </span>
                              </button>
                            );
                          })}
                          {roleFilter.length > 0 && (
                            <button type="button" onClick={() => setRoleFilter([])} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-[11px] font-bold text-rose-600 hover:bg-rose-50">Clear filter</button>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              <span className="ml-auto text-[11px] font-semibold text-slate-400">
                {filteredRoster.length} of {roster.length}
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              {filteredRoster.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => loadDrill(r.id)}
                  className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-xs font-black text-white">
                    {initialsOf(r.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-slate-900">{r.name}</div>
                    <div className="text-[11px] text-slate-500">{r.jobTitle || r.email}</div>
                  </div>
                  <div className="hidden w-40 sm:block">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
                        style={{ width: `${Math.min(100, r.yearAveragePercent)}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-14 text-right text-sm font-black text-brand-600">
                    {r.yearAveragePercent}%
                  </span>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
              ))}
              {filteredRoster.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-slate-500">No employees match.</div>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
