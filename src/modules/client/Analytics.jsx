import {
  useEffect,
  useState,
} from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

import {
  TrendingUp,
  UserCheck,
  Percent,
  Loader2,
  RefreshCw,
  AlertCircle,
  Users,
  Target,
  BarChart3,
} from "lucide-react";

import {
  apiRequest,
} from "../../lib/api";

const COLORS = [
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
  ).toLocaleString(
    "en-IN"
  )}`;
}

function AnalyticsMetric({
  label,
  value,
  icon: Icon,
  detail,
  tone = "indigo",
}) {
  const tones = {
    indigo:
      "bg-indigo-50 text-indigo-600 border-indigo-100",

    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-100",

    amber:
      "bg-amber-50 text-amber-600 border-amber-100",

    slate:
      "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400">
            {label}
          </div>

          <div className="mt-2 text-[24px] leading-none font-bold tracking-tight text-slate-950">
            {value}
          </div>
        </div>

        <div
          className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
            tones[
              tone
            ] ||
            tones.indigo
          }`}
        >
          <Icon
            size={17}
          />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        {detail}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div>
        <h3 className="text-sm font-bold text-slate-900">
          {title}
        </h3>

        {subtitle && (
          <p className="text-xs text-slate-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-5">
        {children}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [
    data,
    setData,
  ] = useState({
    summary: {},
    sourceConversion: [],
    leadsByStage: [],
    monthlyActivity: [],
    employeePerformance: [],
    topCampaigns: [],
  });

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    error,
    setError,
  ] = useState("");

  async function loadAnalytics() {
    setLoading(
      true
    );

    setError("");

    try {
      const result =
        await apiRequest(
          "/api/client/analytics"
        );

      setData(
        result
      );
    } catch (error) {
      setError(
        error
          ?.data
          ?.message ||
          "Unable to load analytics"
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const summary =
    data.summary || {};

  const totalStageLeads =
    data.leadsByStage.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.value ||
            0
        ),
      0
    );

  return (
    <div className="space-y-4">

      {/* PAGE HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Insights / Business Analytics
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Analytics
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor lead performance,
            source conversion,
            admissions, campaigns and
            employee productivity.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadAnalytics
          }
          disabled={
            loading
          }
          className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          <RefreshCw
            size={13}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Refresh data
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 border border-rose-200 bg-rose-50 rounded-lg text-sm text-rose-700">
          <AlertCircle
            size={15}
          />

          {error}
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 flex items-center justify-center gap-2 text-sm text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <Loader2
            size={17}
            className="animate-spin"
          />

          Loading analytics...
        </div>
      ) : (
        <>

          {/* KPI CARDS */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <AnalyticsMetric
              label="Total Leads"
              value={
                summary
                  .totalLeads ||
                0
              }
              icon={
                Users
              }
              detail="All leads recorded in the CRM"
              tone="indigo"
            />

            <AnalyticsMetric
              label="Total Admissions"
              value={
                summary
                  .totalAdmissions ||
                0
              }
              icon={
                UserCheck
              }
              detail="Successful admissions recorded"
              tone="emerald"
            />

            <AnalyticsMetric
              label="Conversion Rate"
              value={`${summary.conversionRate || 0}%`}
              icon={
                Percent
              }
              detail="Overall lead-to-admission conversion"
              tone="emerald"
            />

            <AnalyticsMetric
              label="Tracked Stages"
              value={
                data
                  .leadsByStage
                  .length
              }
              icon={
                Target
              }
              detail={`${totalStageLeads} leads distributed across stages`}
              tone="slate"
            />
          </div>

          {/* PRIMARY CHARTS */}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

            {/* SOURCE CONVERSION */}

            <ChartCard
              title="Source-wise Conversion"
              subtitle="Compare conversion rates across lead acquisition channels."
            >
              {data
                .sourceConversion
                .length >
              0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={
                    280
                  }
                >
                  <BarChart
                    data={
                      data
                        .sourceConversion
                    }
                    margin={{
                      top:
                        5,
                      right:
                        10,
                      left:
                        -10,
                      bottom:
                        0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={
                        false
                      }
                      stroke="#e2e8f0"
                    />

                    <XAxis
                      dataKey="name"
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      tick={{
                        fontSize:
                          11,
                        fill:
                          "#64748b",
                      }}
                    />

                    <YAxis
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      tick={{
                        fontSize:
                          11,
                        fill:
                          "#64748b",
                      }}
                      tickFormatter={(
                        value
                      ) =>
                        `${value}%`
                      }
                    />

                    <Tooltip
                      cursor={{
                        fill:
                          "#f8fafc",
                      }}
                      formatter={(
                        value,
                        name
                      ) =>
                        name ===
                        "Conversion"
                          ? `${value}%`
                          : value
                      }
                      contentStyle={{
                        borderRadius:
                          10,
                        border:
                          "1px solid #e2e8f0",
                        boxShadow:
                          "0 8px 24px rgba(15,23,42,0.08)",
                        fontSize:
                          12,
                      }}
                    />

                    <Bar
                      dataKey="conversion"
                      name="Conversion"
                      fill="#6366f1"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                      maxBarSize={
                        42
                      }
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-sm text-slate-500">
                  No source conversion
                  data yet.
                </div>
              )}
            </ChartCard>

            {/* STAGES */}

            <ChartCard
              title="Lead Stage Distribution"
              subtitle="Understand how leads are distributed across the CRM pipeline."
            >
              {data
                .leadsByStage
                .length >
              0 ? (
                <div className="grid md:grid-cols-[1fr_180px] items-center gap-2">
                  <ResponsiveContainer
                    width="100%"
                    height={
                      280
                    }
                  >
                    <PieChart>
                      <Pie
                        data={
                          data
                            .leadsByStage
                        }
                        dataKey="value"
                        nameKey="name"
                        innerRadius={
                          62
                        }
                        outerRadius={
                          98
                        }
                        paddingAngle={
                          3
                        }
                      >
                        {data.leadsByStage.map(
                          (
                            item,
                            index
                          ) => (
                            <Cell
                              key={
                                item.name
                              }
                              fill={
                                COLORS[
                                  index %
                                    COLORS.length
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          borderRadius:
                            10,
                          border:
                            "1px solid #e2e8f0",
                          boxShadow:
                            "0 8px 24px rgba(15,23,42,0.08)",
                          fontSize:
                            12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {data.leadsByStage.map(
                      (
                        stage,
                        index
                      ) => (
                        <div
                          key={
                            stage.name
                          }
                          className="flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  COLORS[
                                    index %
                                      COLORS.length
                                  ],
                              }}
                            />

                            <span className="text-xs text-slate-600 truncate">
                              {
                                stage.name
                              }
                            </span>
                          </div>

                          <span className="text-xs font-semibold text-slate-900">
                            {
                              stage.value
                            }
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-sm text-slate-500">
                  No lead stage data
                  yet.
                </div>
              )}
            </ChartCard>
          </div>

          {/* SECONDARY CHARTS */}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

            {/* MONTHLY */}

            <ChartCard
              title="Monthly Activity"
              subtitle="Lead generation and admission activity over time."
            >
              {data
                .monthlyActivity
                .length >
              0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={
                    280
                  }
                >
                  <LineChart
                    data={
                      data
                        .monthlyActivity
                    }
                    margin={{
                      top:
                        5,
                      right:
                        10,
                      left:
                        -10,
                      bottom:
                        0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={
                        false
                      }
                      stroke="#e2e8f0"
                    />

                    <XAxis
                      dataKey="m"
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      tick={{
                        fontSize:
                          11,
                        fill:
                          "#64748b",
                      }}
                    />

                    <YAxis
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      tick={{
                        fontSize:
                          11,
                        fill:
                          "#64748b",
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius:
                          10,
                        border:
                          "1px solid #e2e8f0",
                        boxShadow:
                          "0 8px 24px rgba(15,23,42,0.08)",
                        fontSize:
                          12,
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="leads"
                      name="Leads"
                      stroke="#6366f1"
                      strokeWidth={
                        2.5
                      }
                      dot={{
                        r:
                          3,
                      }}
                      activeDot={{
                        r:
                          5,
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="admissions"
                      name="Admissions"
                      stroke="#10b981"
                      strokeWidth={
                        2.5
                      }
                      dot={{
                        r:
                          3,
                      }}
                      activeDot={{
                        r:
                          5,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-sm text-slate-500">
                  No monthly activity
                  yet.
                </div>
              )}
            </ChartCard>

            {/* EMPLOYEES */}

            <ChartCard
              title="Employee Performance"
              subtitle="Compare lead ownership and admissions by employee."
            >
              {data
                .employeePerformance
                .length >
              0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={
                    280
                  }
                >
                  <BarChart
                    data={
                      data
                        .employeePerformance
                    }
                    margin={{
                      top:
                        5,
                      right:
                        10,
                      left:
                        -10,
                      bottom:
                        0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={
                        false
                      }
                      stroke="#e2e8f0"
                    />

                    <XAxis
                      dataKey="name"
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      tick={{
                        fontSize:
                          11,
                        fill:
                          "#64748b",
                      }}
                    />

                    <YAxis
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      tick={{
                        fontSize:
                          11,
                        fill:
                          "#64748b",
                      }}
                    />

                    <Tooltip
                      cursor={{
                        fill:
                          "#f8fafc",
                      }}
                      contentStyle={{
                        borderRadius:
                          10,
                        border:
                          "1px solid #e2e8f0",
                        boxShadow:
                          "0 8px 24px rgba(15,23,42,0.08)",
                        fontSize:
                          12,
                      }}
                    />

                    <Bar
                      dataKey="leads"
                      name="Leads"
                      fill="#cbd5e1"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                    />

                    <Bar
                      dataKey="admissions"
                      name="Admissions"
                      fill="#10b981"
                      radius={[
                        5,
                        5,
                        0,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-sm text-slate-500">
                  No employee
                  performance data yet.
                </div>
              )}
            </ChartCard>
          </div>

          {/* CAMPAIGNS */}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3
                    size={15}
                    className="text-indigo-600"
                  />

                  <h3 className="text-sm font-bold text-slate-900">
                    Top Campaigns
                  </h3>
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  Campaigns ranked by
                  lead and admission
                  performance.
                </p>
              </div>

              <div className="text-xs text-slate-500">
                {
                  data
                    .topCampaigns
                    .length
                }{" "}
                campaigns
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.08em] font-semibold text-slate-500">
                      Campaign
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.08em] font-semibold text-slate-500">
                      Leads
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.08em] font-semibold text-slate-500">
                      Admissions
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.08em] font-semibold text-slate-500">
                      Conversion
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.topCampaigns.map(
                    (
                      campaign
                    ) => (
                      <tr
                        key={
                          campaign.campaign
                        }
                        className="border-t border-slate-100 hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {
                              campaign.campaign
                            }
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-slate-700 tabular-nums">
                          {
                            campaign.leads
                          }
                        </td>

                        <td className="px-5 py-3.5 font-semibold text-emerald-700 tabular-nums">
                          {
                            campaign.admissions
                          }
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{
                                  width:
                                    `${Math.min(
                                      Number(
                                        campaign.conversion ||
                                          0
                                      ),
                                      100
                                    )}%`,
                                }}
                              />
                            </div>

                            <span className="text-xs font-semibold text-slate-700 tabular-nums">
                              {
                                campaign.conversion
                              }
                              %
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  )}

                  {!data
                    .topCampaigns
                    .length && (
                    <tr>
                      <td
                        colSpan={
                          4
                        }
                        className="px-5 py-12 text-center text-sm text-slate-500"
                      >
                        No campaign data
                        yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}