import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Mail,
  Phone,
  Search,
  RefreshCw,
  UsersRound,
  Video,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { apiRequest } from "../../lib/api";

const STATUS_META = {
  NEW: { label: "New", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  CONTACTED: { label: "Contacted", className: "bg-sky-50 text-sky-700 border-sky-200" },
  FOLLOW_UP: { label: "Follow up", className: "bg-amber-50 text-amber-700 border-amber-200" },
  DEMO_SCHEDULED: { label: "Demo scheduled", className: "bg-violet-50 text-violet-700 border-violet-200" },
  WON: { label: "Won", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  LOST: { label: "Lost", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

const STATUS_OPTIONS = Object.keys(STATUS_META);

function dateLabel(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>
          <div className="mt-1 text-[11px] text-slate-400">{helper}</div>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

export default function WebsiteLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [savingId, setSavingId] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/admin/website-leads");
      setLeads(data.leads || []);
    } catch (err) {
      setError(err?.data?.message || "Unable to load website leads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(
    () => ({
      total: leads.length,
      fresh: leads.filter((lead) => lead.status === "NEW").length,
      demos: leads.filter((lead) => lead.demoRequested).length,
      won: leads.filter((lead) => lead.status === "WON").length,
    }),
    [leads]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (status !== "ALL" && lead.status !== status) return false;
      if (!q) return true;
      return [lead.fullName, lead.email, lead.phone, lead.companyName, lead.teamSize]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [leads, search, status]);

  async function updateStatus(lead, nextStatus) {
    setSavingId(lead.id);
    setError("");
    try {
      const data = await apiRequest(`/api/admin/website-leads/${lead.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setLeads((current) => current.map((item) => (item.id === lead.id ? data.lead : item)));
    } catch (err) {
      setError(err?.data?.message || "Unable to update lead status");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950">Website Leads</h1>
          <p className="mt-1 text-sm text-slate-500">
            Visitors captured from the Bispun website, including people who leave before finishing the demo booking.
          </p>
        </div>
        <button type="button" onClick={load} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UsersRound} label="Total leads" value={summary.total} helper="All captured website contacts" />
        <StatCard icon={UsersRound} label="New" value={summary.fresh} helper="Waiting for first contact" />
        <StatCard icon={Video} label="Demo requests" value={summary.demos} helper="Completed demo preference" />
        <StatCard icon={CheckCircle2} label="Won" value={summary.won} helper="Converted website leads" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, email or company..." className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400">
            <option value="ALL">All statuses</option>
            {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{STATUS_META[value].label}</option>)}
          </select>
        </div>

        {error && <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">{error}</div>}

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading website leads...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">No website leads match this view.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Capture</th>
                  <th className="px-4 py-3 font-semibold">Preferred demo</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Captured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((lead) => {
                  const meta = STATUS_META[lead.status] || STATUS_META.NEW;
                  return (
                    <tr key={lead.id} className="align-top hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{lead.fullName}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700"><Phone size={12} />{lead.phone}</a>
                          <a href={`mailto:${lead.email}`} className="inline-flex max-w-[220px] items-center gap-1.5 truncate rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700"><Mail size={12} />{lead.email}</a>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Building2 size={14} className="text-slate-400" />{lead.companyName || "Not provided"}</div>
                        <div className="mt-1 text-xs text-slate-500">Team: {lead.teamSize || "—"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">Step {lead.lastStep || 1} of 3</span>
                        <div className="mt-2 text-xs font-semibold text-slate-700">{lead.demoRequested ? "Demo request sent" : "Contact captured"}</div>
                        {lead.note && <div className="mt-1 max-w-[220px] text-[11px] leading-5 text-slate-500">{lead.note}</div>}
                      </td>
                      <td className="px-4 py-4">
                        {lead.demoRequested ? (
                          <div>
                            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800"><CalendarDays size={13} className="text-indigo-500" />{dateLabel(lead.preferredDate)}</div>
                            <div className="mt-1 text-xs text-slate-500">{lead.preferredTime || "Time not provided"}</div>
                          </div>
                        ) : <span className="text-xs text-slate-400">Not completed</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className={`mb-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${meta.className}`}>{meta.label}</div>
                        <select disabled={savingId === lead.id} value={lead.status} onChange={(event) => updateStatus(lead, event.target.value)} className="block h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none disabled:opacity-50">
                          {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{STATUS_META[value].label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        <div>{dateLabel(lead.createdAt)}</div>
                        <div className="mt-1 text-[10px] text-slate-400">Updated {dateLabel(lead.updatedAt)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
