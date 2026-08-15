import {
  useEffect,
  useState,
} from "react";

import {
  UserCheck,
  DollarSign,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Target,
  CircleDollarSign,
  Wallet,
  Users,
  Activity,
} from "lucide-react";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
} from "../../components/ui";

import { apiRequest } from "../../lib/api";

const PIE_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];

function money(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;
}

function axisMoney(value) {
  const amount =
    Number(value || 0);

  if (amount >= 10000000) {
    return `₹${(
      amount / 10000000
    ).toFixed(1)}Cr`;
  }

  if (amount >= 100000) {
    return `₹${(
      amount / 100000
    ).toFixed(1)}L`;
  }

  if (amount >= 1000) {
    return `₹${(
      amount / 1000
    ).toFixed(0)}k`;
  }

  return `₹${amount}`;
}


function LayoutDashboardIcon() {
  return <Activity size={13} />;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  detail,
  accent = "indigo",
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-[24px] leading-none font-bold tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${tones[accent] || tones.indigo}`}>
          <Icon size={17} />
        </div>
      </div>
      {detail && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          {detail}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({
  tenant,
}) {
  const [data, setData] =
    useState({
      summary: {},
      revenueTrend: [],
      leadsBySource: [],
      teamPerformance: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const result =
        await apiRequest(
          "/api/client/analytics/dashboard"
        );

      setData(result);
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary =
    data.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <LayoutDashboardIcon />
            Business overview
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Welcome back, {tenant.owner?.split(" ")[0] || "Admin"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {tenant.name} · {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="h-9 px-3.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-2 shadow-sm hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh data
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 border border-rose-200 bg-rose-50 rounded-md text-sm text-rose-700">
          <AlertCircle
            size={15}
          />
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard label="Total Leads" value={summary.totalLeads || 0} icon={Users} detail="All leads captured in the CRM" accent="indigo" />
            <MetricCard label="New Leads" value={summary.newLeads || 0} icon={Clock} detail="Leads currently awaiting action" accent="amber" />
            <MetricCard label="Qualified Leads" value={summary.qualifiedLeads || 0} icon={Target} detail="Sales-ready opportunities" accent="indigo" />
            <MetricCard label="Total Admissions" value={summary.totalAdmissions || 0} icon={UserCheck} detail="Successful admissions recorded" accent="emerald" />
            <MetricCard label="Potential Revenue" value={money(summary.potentialRevenue)} icon={CircleDollarSign} detail="Total admission value" accent="indigo" />
            <MetricCard label="Received Amount" value={money(summary.receivedAmount)} icon={DollarSign} detail="Revenue collected to date" accent="emerald" />
            <MetricCard label="Pending Amount" value={money(summary.pendingAmount)} icon={Clock} detail="Amount still to be collected" accent="amber" />
            <MetricCard label="Current Profit" value={money(summary.currentProfit)} icon={Wallet} detail="Current calculated profitability" accent={summary.currentProfit >= 0 ? "emerald" : "rose"} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <h3 className="text-sm font-bold text-slate-900 mb-4">
                Revenue Trend
              </h3>

              <ResponsiveContainer
                width="100%"
                height={260}
              >
                <BarChart
                  data={
                    data.revenueTrend
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="m"
                    fontSize={11}
                    stroke="#64748b"
                  />

                  <YAxis
                    fontSize={11}
                    stroke="#64748b"
                    tickFormatter={
                      axisMoney
                    }
                  />

                  <Tooltip
                    formatter={(value) =>
                      money(value)
                    }
                  />

                  <Bar
                    dataKey="potential"
                    name="Potential"
                    fill="#cbd5e1"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="received"
                    name="Received"
                    fill="#6366f1"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <h3 className="text-sm font-bold text-slate-900 mb-4">
                Leads by Source
              </h3>

              {data.leadsBySource
                .length > 0 ? (
                <>
                  <ResponsiveContainer
                    width="100%"
                    height={220}
                  >
                    <PieChart>
                      <Pie
                        data={
                          data.leadsBySource
                        }
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {data.leadsBySource.map(
                          (
                            entry,
                            index
                          ) => (
                            <Cell
                              key={
                                entry.name
                              }
                              fill={
                                PIE_COLORS[
                                  index %
                                    PIE_COLORS.length
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="mt-2 space-y-1">
                    {data.leadsBySource.map(
                      (
                        source,
                        index
                      ) => (
                        <div
                          key={
                            source.name
                          }
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                background:
                                  PIE_COLORS[
                                    index %
                                      PIE_COLORS.length
                                  ],
                              }}
                            />

                            {source.name}
                          </div>

                          <span className="text-slate-500">
                            {
                              source.value
                            }
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-slate-500">
                  No lead data yet.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Team Performance
            </h3>

            {data.teamPerformance
              .length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {data.teamPerformance.map(
                  (member) => (
                    <div
                      key={member.name}
                      className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                      <div className="text-sm font-medium text-slate-900">
                        {member.name}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                        <div>
                          <div className="text-slate-500">
                            Leads
                          </div>

                          <div className="font-semibold text-slate-900">
                            {
                              member.leads
                            }
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-500">
                            Adm
                          </div>

                          <div className="font-semibold text-slate-900">
                            {
                              member.admissions
                            }
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-500">
                            Rev
                          </div>

                          <div className="font-semibold text-slate-900">
                            {money(
                              member.revenue
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                No team activity yet.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
