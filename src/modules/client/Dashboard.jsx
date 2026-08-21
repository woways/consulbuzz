import { useEffect, useMemo, useState } from "react";

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
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Pencil,
  MapPin,
  UserRound,
  CheckCircle2,
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

import { apiRequest } from "../../lib/api";

const PIE_COLORS = [
  "#1d4ed8",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#334155",
  "#94a3b8",
];

const EVENT_TYPES = [
  { value: "MEETING", label: "Meeting" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "COUNSELLING", label: "Counselling" },
  { value: "ADMISSION", label: "Admission" },
  { value: "PAYMENT", label: "Payment" },
  { value: "REMINDER", label: "Reminder" },
  { value: "OTHER", label: "Other" },
];

const EVENT_TYPE_STYLES = {
  MEETING:
    "bg-indigo-50 text-indigo-700 border-indigo-100",
  FOLLOW_UP:
    "bg-amber-50 text-amber-700 border-amber-100",
  COUNSELLING:
    "bg-violet-50 text-violet-700 border-violet-100",
  ADMISSION:
    "bg-indigo-50 text-indigo-700 border-indigo-100",
  PAYMENT:
    "bg-cyan-50 text-cyan-700 border-cyan-100",
  REMINDER:
    "bg-rose-50 text-rose-700 border-rose-100",
  OTHER:
    "bg-slate-100 text-slate-700 border-slate-200",
};

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function axisMoney(value) {
  const amount = Number(value || 0);

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}k`;
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
    indigo:
      "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald:
      "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber:
      "bg-amber-50 text-amber-600 border-amber-100",
    rose:
      "bg-rose-50 text-rose-600 border-rose-100",
    slate:
      "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {label}
          </div>

          <div className="mt-2 text-[20px] sm:text-[24px] leading-none font-bold tracking-tight text-slate-950 break-words">
            {value}
          </div>
        </div>

        <div
          className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${
            tones[accent] || tones.indigo
          }`}
        >
          <Icon size={17} />
        </div>
      </div>

      {detail && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] sm:text-[11px] text-slate-500">
          {detail}
        </div>
      )}
    </div>
  );
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function localDateTimeValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const hour = String(
    date.getHours()
  ).padStart(2, "0");

  const minute = String(
    date.getMinutes()
  ).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function minimumDateTimeLocal() {
  const now = new Date();

  now.setSeconds(0, 0);

  return localDateTimeValue(now);
}

function isPastDateTime(value) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getTime() < Date.now();
}

function eventDateKey(event) {
  return dateKey(
    new Date(event.startAt)
  );
}

function eventTime(event) {
  if (event.allDay) {
    return "All day";
  }

  return new Date(
    event.startAt
  ).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function typeLabel(value) {
  return (
    EVENT_TYPES.find(
      (item) => item.value === value
    )?.label || value
  );
}

function emptyEventForm() {
  return {
    title: "",
    startAt: "",
    endAt: "",
    type: "MEETING",
    status: "SCHEDULED",
    assignedToUserId: "",
    location: "",
    description: "",
    allDay: false,
  };
}

export default function Dashboard({
  tenant,
  user,
  selectedYear = "all",
}) {
  const [data, setData] = useState({
    summary: {},
    revenueTrend: [],
    leadsBySource: [],
    teamPerformance: [],
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const [
    calendarMonth,
    setCalendarMonth,
  ] = useState(() => {
    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );
  });

  const [
    agendaDate,
    setAgendaDate,
  ] = useState(() => new Date());

  const [
    fullCalendarOpen,
    setFullCalendarOpen,
  ] = useState(false);

  const [
    calendarEvents,
    setCalendarEvents,
  ] = useState([]);

  const [
    calendarUsers,
    setCalendarUsers,
  ] = useState([]);

  const [
    calendarLoading,
    setCalendarLoading,
  ] = useState(true);

  const [
    calendarError,
    setCalendarError,
  ] = useState("");

  const [
    eventModalOpen,
    setEventModalOpen,
  ] = useState(false);

  const [
    editingEvent,
    setEditingEvent,
  ] = useState(null);

  const [
    eventForm,
    setEventForm,
  ] = useState(emptyEventForm);

  const [
    savingEvent,
    setSavingEvent,
  ] = useState(false);

  const [
    deletingEventId,
    setDeletingEventId,
  ] = useState("");

  async function loadDashboard(
    year = selectedYear
  ) {
    setLoading(true);
    setError("");

    try {
      const result =
        await apiRequest(
          `/api/client/analytics/dashboard?year=${encodeURIComponent(
            year
          )}`
        );

      setData({
        summary:
          result.summary || {},
        revenueTrend:
          result.revenueTrend || [],
        leadsBySource:
          result.leadsBySource || [],
        teamPerformance:
          result.teamPerformance || [],
      });

    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCalendarUsers() {
    try {
      const result =
        await apiRequest(
          "/api/client/calendar/users"
        );

      setCalendarUsers(
        result.users || []
      );
    } catch (error) {
      console.error(
        "Unable to load calendar users:",
        error
      );
    }
  }

  async function loadCalendar() {
    setCalendarLoading(true);
    setCalendarError("");

    try {
      const year =
        calendarMonth.getFullYear();

      const month =
        calendarMonth.getMonth();

      const from = new Date(
        year,
        month,
        1,
        0,
        0,
        0
      );

      const to = new Date(
        year,
        month + 1,
        7,
        23,
        59,
        59
      );

      const result =
        await apiRequest(
          `/api/client/calendar?from=${encodeURIComponent(
            from.toISOString()
          )}&to=${encodeURIComponent(
            to.toISOString()
          )}`
        );

      setCalendarEvents(
        result.events || []
      );
    } catch (error) {
      setCalendarError(
        error?.data?.message ||
          "Unable to load calendar"
      );
    } finally {
      setCalendarLoading(false);
    }
  }

  useEffect(() => {
    loadCalendarUsers();
  }, []);

  useEffect(() => {
    loadDashboard(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    loadCalendar();
  }, [calendarMonth]);

  function openCreateEvent(
    date = new Date()
  ) {
    const selected =
      new Date(date);

    const now =
      new Date();

    const isToday =
      selected.getFullYear() ===
        now.getFullYear() &&
      selected.getMonth() ===
        now.getMonth() &&
      selected.getDate() ===
        now.getDate();

    if (isToday) {
      const rounded =
        new Date(now);

      rounded.setSeconds(
        0,
        0
      );

      const minutes =
        rounded.getMinutes();

      const remainder =
        minutes % 15;

      if (remainder) {
        rounded.setMinutes(
          minutes +
            (15 - remainder)
        );
      }

      selected.setHours(
        rounded.getHours(),
        rounded.getMinutes(),
        0,
        0
      );
    } else {
      selected.setHours(
        9,
        0,
        0,
        0
      );
    }

    const end =
      new Date(selected);

    end.setHours(
      end.getHours() + 1
    );

    setEditingEvent(null);

    setEventForm({
      ...emptyEventForm(),
      startAt:
        localDateTimeValue(
          selected
        ),
      endAt:
        localDateTimeValue(end),
      assignedToUserId:
        user?.id || "",
    });

    setEventModalOpen(true);
  }

  function openEditEvent(event) {
    setEditingEvent(event);

    setEventForm({
      title:
        event.title || "",
      startAt:
        localDateTimeValue(
          event.startAt
        ),
      endAt:
        localDateTimeValue(
          event.endAt
        ),
      type:
        event.type ||
        "MEETING",
      status:
        event.status ||
        "SCHEDULED",
      assignedToUserId:
        event.assignedToUserId ||
        "",
      location:
        event.location || "",
      description:
        event.description || "",
      allDay:
        event.allDay === true,
    });

    setEventModalOpen(true);
  }

  async function saveEvent(event) {
    event.preventDefault();

    if (
      !eventForm.title.trim() ||
      !eventForm.startAt
    ) {
      return;
    }

    if (
      !editingEvent &&
      isPastDateTime(
        eventForm.startAt
      )
    ) {
      setCalendarError(
        "New calendar events cannot be scheduled in the past."
      );
      return;
    }

    if (
      eventForm.endAt &&
      new Date(
        eventForm.endAt
      ) <
        new Date(
          eventForm.startAt
        )
    ) {
      setCalendarError(
        "Event end time cannot be before the start time."
      );
      return;
    }

    setSavingEvent(true);
    setCalendarError("");

    try {
      const payload = {
        title:
          eventForm.title.trim(),
        type:
          eventForm.type,
        status:
          eventForm.status,

        startAt:
          new Date(
            eventForm.startAt
          ).toISOString(),

        endAt:
          eventForm.endAt
            ? new Date(
                eventForm.endAt
              ).toISOString()
            : null,

        assignedToUserId:
          eventForm.assignedToUserId ||
          null,

        location:
          eventForm.location.trim() ||
          null,

        description:
          eventForm.description.trim() ||
          null,

        allDay:
          eventForm.allDay,
      };

      if (editingEvent) {
        await apiRequest(
          `/api/client/calendar/${editingEvent.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(
              payload
            ),
          }
        );
      } else {
        await apiRequest(
          "/api/client/calendar",
          {
            method: "POST",
            body: JSON.stringify(
              payload
            ),
          }
        );
      }

      setEventModalOpen(false);
      setEditingEvent(null);

      setEventForm(
        emptyEventForm()
      );

      await loadCalendar();
    } catch (error) {
      setCalendarError(
        error?.data?.message ||
          "Unable to save calendar event"
      );
    } finally {
      setSavingEvent(false);
    }
  }

  async function deleteEvent(id) {
    if (
      !window.confirm(
        "Delete this calendar event?"
      )
    ) {
      return;
    }

    setDeletingEventId(id);

    try {
      await apiRequest(
        `/api/client/calendar/${id}`,
        {
          method: "DELETE",
        }
      );

      if (
        editingEvent?.id === id
      ) {
        setEventModalOpen(false);
        setEditingEvent(null);
      }

      await loadCalendar();
    } catch (error) {
      setCalendarError(
        error?.data?.message ||
          "Unable to delete event"
      );
    } finally {
      setDeletingEventId("");
    }
  }

  const summary =
    data.summary || {};

  const todayKey =
    dateKey(new Date());

  const todayEvents =
    useMemo(() => {
      return calendarEvents
        .filter(
          (event) =>
            eventDateKey(event) ===
              todayKey &&
            event.status !==
              "CANCELLED"
        )
        .sort(
          (a, b) =>
            new Date(a.startAt) -
            new Date(b.startAt)
        );
    }, [
      calendarEvents,
      todayKey,
    ]);

  const upcomingEvents =
    useMemo(() => {
      const now = new Date();

      return calendarEvents
        .filter(
          (event) =>
            new Date(
              event.startAt
            ) > now &&
            event.status !==
              "CANCELLED" &&
            eventDateKey(event) !==
              todayKey
        )
        .sort(
          (a, b) =>
            new Date(a.startAt) -
            new Date(b.startAt)
        )
        .slice(0, 6);
    }, [
      calendarEvents,
      todayKey,
    ]);

  const agendaEvents =
    useMemo(() => {
      const key =
        dateKey(agendaDate);

      return calendarEvents
        .filter(
          (event) =>
            eventDateKey(event) ===
              key &&
            event.status !==
              "CANCELLED"
        )
        .sort(
          (a, b) =>
            new Date(a.startAt) -
            new Date(b.startAt)
        );
    }, [
      calendarEvents,
      agendaDate,
    ]);

  function moveAgendaDay(offset) {
    const next =
      new Date(agendaDate);

    next.setDate(
      next.getDate() + offset
    );

    setAgendaDate(next);

    if (
      next.getFullYear() !==
        calendarMonth.getFullYear() ||
      next.getMonth() !==
        calendarMonth.getMonth()
    ) {
      setCalendarMonth(
        new Date(
          next.getFullYear(),
          next.getMonth(),
          1
        )
      );
    }
  }


  return (
    <div className="space-y-6">
      {/* DASHBOARD HEADER */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <LayoutDashboardIcon />
            ConsulBuzz overview
          </div>

          <h1 className="mt-2 text-[26px] font-bold tracking-[-0.035em] text-slate-950">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Leads, admissions, revenue and finance performance in one view.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadDashboard(selectedYear);
            loadCalendar();
          }}
          disabled={loading || calendarLoading}
          className="h-9 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-2 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={
              loading || calendarLoading
                ? "animate-spin"
                : ""
            }
          />
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
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2
            size={18}
            className="animate-spin"
          />

          Loading dashboard...
        </div>
      ) : (
        <>
          {/* CONSULBUZZ KPI + ANALYTICS + CALENDAR */}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-4 items-start">
            <div className="space-y-4">
              <div className="grid grid-cols-2 2xl:grid-cols-4 gap-3 sm:gap-4 content-start">
              <MetricCard
                label="Total Leads"
                value={summary.totalLeads || 0}
                icon={Users}
                detail={
                  selectedYear === "all"
                    ? "All CRM leads"
                    : `CRM leads in ${selectedYear}`
                }
                accent="indigo"
              />

              <MetricCard
                label="New Leads"
                value={summary.newLeads || 0}
                icon={Clock}
                detail="Leads awaiting action"
                accent="amber"
              />

              <MetricCard
                label="Qualified Leads"
                value={summary.qualifiedLeads || 0}
                icon={Target}
                detail="Qualified lead opportunities"
                accent="indigo"
              />

              <MetricCard
                label="Admissions"
                value={summary.totalAdmissions || 0}
                icon={UserCheck}
                detail={
                  selectedYear === "all"
                    ? "Recorded admissions"
                    : `Admissions in ${selectedYear}`
                }
                accent="emerald"
              />

              <MetricCard
                label="Potential Revenue"
                value={money(summary.potentialRevenue)}
                icon={CircleDollarSign}
                detail="Total admission revenue value"
                accent="indigo"
              />

              <MetricCard
                label="Received Revenue"
                value={money(summary.receivedAmount)}
                icon={DollarSign}
                detail="Revenue already received"
                accent="emerald"
              />

              <MetricCard
                label="Pending Revenue"
                value={money(summary.pendingAmount)}
                icon={Clock}
                detail="Revenue pending collection"
                accent="amber"
              />

              <MetricCard
                label="Finance / Profit"
                value={money(summary.currentProfit)}
                icon={Wallet}
                detail={
                  selectedYear === "all"
                    ? "Current CRM profitability"
                    : `Profit for ${selectedYear}`
                }
                accent={
                  summary.currentProfit >= 0
                    ? "emerald"
                    : "rose"
                }
              />
            </div>

              {/* ANALYTICS — immediately below KPI cards */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Revenue Trend
                  </h3>

                  <span className="text-[10px] font-semibold text-slate-400">
                    {selectedYear ===
                    "all"
                      ? "Last 8 months"
                      : selectedYear}
                  </span>
                </div>

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

              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
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

                              {
                                source.name
                              }
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
            </div>

            {/* RIGHT CORNER CALENDAR */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_26px_rgba(15,23,42,0.05)] overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[16px] font-bold text-slate-950">
                    Calendar
                  </div>
                  <div className="mt-1 text-[12px] font-semibold text-slate-700">
                    {agendaDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFullCalendarOpen(true)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View full
                </button>
              </div>

              <div className="px-5 pb-3 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => moveAgendaDay(-1)}
                  className="w-8 h-8 rounded-lg text-indigo-700 hover:bg-indigo-50 flex items-center justify-center"
                  aria-label="Previous day"
                >
                  <ChevronLeft size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setAgendaDate(today);
                    setCalendarMonth(
                      new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        1
                      )
                    );
                  }}
                  className="h-8 px-2.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => moveAgendaDay(1)}
                  className="w-8 h-8 rounded-lg text-indigo-700 hover:bg-indigo-50 flex items-center justify-center"
                  aria-label="Next day"
                >
                  <ChevronRight size={17} />
                </button>
              </div>

              <div className="px-5 pb-5">
                {calendarLoading ? (
                  <div className="h-[320px] flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Loader2 size={15} className="animate-spin" />
                    Loading calendar...
                  </div>
                ) : calendarError ? (
                  <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">
                    {calendarError}
                  </div>
                ) : (
                  <div className="relative min-h-[320px]">
                    <div className="absolute left-[53px] top-0 bottom-0 w-px bg-slate-200" />

                    {["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"].map(
                      (time) => (
                        <div
                          key={time}
                          className="h-[42px] relative flex items-start"
                        >
                          <div className="w-[46px] pt-0.5 text-[10px] text-slate-500">
                            {time}
                          </div>
                          <div className="flex-1 border-t border-slate-100" />
                        </div>
                      )
                    )}

                    {agendaEvents.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <CalendarDays
                            size={21}
                            className="mx-auto text-slate-300"
                          />
                          <div className="mt-2 text-xs font-semibold text-slate-600">
                            No events
                          </div>
                          <button
                            type="button"
                            onClick={() => openCreateEvent(agendaDate)}
                            className="mt-2 text-[11px] font-semibold text-indigo-600"
                          >
                            + Add event
                          </button>
                        </div>
                      </div>
                    )}

                    {agendaEvents.map((item, index) => {
                      const start = new Date(item.startAt);
                      const hour = start.getHours();
                      const minute = start.getMinutes();

                      const clampedHour = Math.max(9, Math.min(hour, 17));
                      const top =
                        (clampedHour - 9) * 42 +
                        Math.round((minute / 60) * 42);

                      const style =
                        EVENT_TYPE_STYLES[item.type] ||
                        EVENT_TYPE_STYLES.OTHER;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openEditEvent(item)}
                          className={`absolute left-[62px] right-0 rounded-xl border px-3 py-2 text-left shadow-sm ${style}`}
                          style={{
                            top: `${Math.min(top, 290)}px`,
                            minHeight: "54px",
                            zIndex: 10 + index,
                          }}
                        >
                          <div className="text-[11px] font-bold truncate">
                            {item.title}
                          </div>
                          <div className="mt-1 text-[10px] opacity-80">
                            {eventTime(item)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  disabled={
                    new Date(
                      agendaDate.getFullYear(),
                      agendaDate.getMonth(),
                      agendaDate.getDate(),
                      23,
                      59,
                      59,
                      999
                    ) <
                    new Date()
                  }
                  onClick={() => openCreateEvent(agendaDate)}
                  className="mt-3 h-9 w-full rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                >
                  <Plus size={13} />
                  Add calendar event
                </button>
              </div>
            </div>
          </div>

          {/* TEAM PERFORMANCE */}

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Team Performance
              </h3>

              <div className="text-[10px] font-semibold text-slate-400">
                {selectedYear ===
                "all"
                  ? "All Time"
                  : selectedYear}
              </div>
            </div>

            {data.teamPerformance
              .length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {data.teamPerformance.map(
                  (member) => (
                    <div
                      key={
                        member.name
                      }
                      className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                      <div className="text-sm font-medium text-slate-900">
                        {
                          member.name
                        }
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
                No team activity for
                this period.
              </div>
            )}
          </div>
        </>
      )}

      {/* EVENT MODAL */}

      {fullCalendarOpen && (
        <div className="fixed inset-0 z-[88] bg-slate-950/45 backdrop-blur-[2px] p-3 sm:p-6 overflow-y-auto">
          <div className="max-w-[1380px] mx-auto bg-[#f7f8fb] rounded-2xl shadow-2xl border border-white overflow-hidden">
            <div className="h-16 px-5 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-slate-950">
                  ConsulBuzz Calendar
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Meetings, follow-ups, counselling, admissions and payment reminders.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFullCalendarOpen(false)}
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 flex items-center justify-center"
                aria-label="Close full calendar"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_340px] gap-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarDays
                      size={17}
                      className="text-indigo-600"
                    />

                    <h3 className="text-sm font-bold text-slate-950">
                      My Calendar
                    </h3>
                  </div>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Meetings, follow-ups,
                    counselling and
                    important CRM events.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          new Date().getFullYear(),
                          new Date().getMonth(),
                          1
                        )
                      )
                    }
                    className="h-8 px-3 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openCreateEvent(
                        new Date()
                      )
                    }
                    className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus size={13} />

                    Add event
                  </button>
                </div>
              </div>

              {calendarError && (
                <div className="mx-4 sm:mx-5 mt-4 px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-700">
                  {calendarError}
                </div>
              )}

              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() -
                            1,
                          1
                        )
                      )
                    }
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                  >
                    <ChevronLeft
                      size={15}
                    />
                  </button>

                  <div className="text-sm font-bold text-slate-900">
                    {calendarMonth.toLocaleDateString(
                      "en-IN",
                      {
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() +
                            1,
                          1
                        )
                      )
                    }
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                  >
                    <ChevronRight
                      size={15}
                    />
                  </button>
                </div>

                {calendarLoading ? (
                  <div className="h-[360px] sm:h-[420px] flex items-center justify-center gap-2 text-sm text-slate-500">
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Loading calendar...
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-1 pb-1">
                    <div className="min-w-[700px] grid grid-cols-7 border-t border-l border-slate-200 rounded-xl overflow-hidden">
                      {[
                        "Sun",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                      ].map((day) => (
                        <div
                          key={day}
                          className="bg-slate-50 border-r border-b border-slate-200 px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500"
                        >
                          {day}
                        </div>
                      ))}

                      {(() => {
                        const year =
                          calendarMonth.getFullYear();

                        const month =
                          calendarMonth.getMonth();

                        const firstDay =
                          new Date(
                            year,
                            month,
                            1
                          ).getDay();

                        const days =
                          new Date(
                            year,
                            month + 1,
                            0
                          ).getDate();

                        const cells = [];

                        for (
                          let i = 0;
                          i < firstDay;
                          i += 1
                        ) {
                          cells.push(
                            <div
                              key={`blank-${i}`}
                              className="min-h-[96px] bg-slate-50/40 border-r border-b border-slate-200"
                            />
                          );
                        }

                        for (
                          let day = 1;
                          day <= days;
                          day += 1
                        ) {
                          const date =
                            new Date(
                              year,
                              month,
                              day
                            );

                          const dayEnd =
                            new Date(
                              year,
                              month,
                              day,
                              23,
                              59,
                              59,
                              999
                            );

                          const isPastDay =
                            dayEnd <
                            new Date();

                          const key =
                            dateKey(date);

                          const dayEvents =
                            calendarEvents
                              .filter(
                                (event) =>
                                  eventDateKey(
                                    event
                                  ) === key
                              )
                              .sort(
                                (a, b) =>
                                  new Date(
                                    a.startAt
                                  ) -
                                  new Date(
                                    b.startAt
                                  )
                              );

                          const isToday =
                            key ===
                            todayKey;

                          cells.push(
                            <div
                              key={key}
                              onDoubleClick={() => {
                                if (
                                  !isPastDay
                                ) {
                                  openCreateEvent(
                                    date
                                  );
                                }
                              }}
                              className={`min-h-[96px] p-2 border-r border-b border-slate-200 transition-colors overflow-hidden ${
                                isPastDay
                                  ? "bg-slate-50/70"
                                  : "bg-white hover:bg-slate-50/70"
                              }`}
                            >
                              <button
                                type="button"
                                disabled={isPastDay}
                                onClick={() => {
                                  if (
                                    !isPastDay
                                  ) {
                                    openCreateEvent(
                                      date
                                    );
                                  }
                                }}
                                className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                                  isToday
                                    ? "bg-indigo-600 text-white"
                                    : isPastDay
                                    ? "text-slate-300 cursor-not-allowed"
                                    : "text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {day}
                              </button>

                              <div className="mt-1.5 space-y-1">
                                {dayEvents
                                  .slice(0, 3)
                                  .map(
                                    (item) => (
                                      <button
                                        key={
                                          item.id
                                        }
                                        type="button"
                                        onClick={() =>
                                          openEditEvent(
                                            item
                                          )
                                        }
                                        className={`w-full truncate text-left rounded-md border px-1.5 py-1 text-[9px] font-semibold ${
                                          EVENT_TYPE_STYLES[
                                            item
                                              .type
                                          ] ||
                                          EVENT_TYPE_STYLES.OTHER
                                        }`}
                                      >
                                        {!item.allDay
                                          ? `${new Date(
                                              item.startAt
                                            ).toLocaleTimeString(
                                              "en-IN",
                                              {
                                                hour:
                                                  "2-digit",
                                                minute:
                                                  "2-digit",
                                              }
                                            )} `
                                          : ""}

                                        {
                                          item.title
                                        }
                                      </button>
                                    )
                                  )}

                                {dayEvents.length >
                                  3 && (
                                  <div className="text-[9px] font-semibold text-slate-400 px-1">
                                    +
                                    {dayEvents.length -
                                      3}{" "}
                                    more
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }

                        return cells;
                      })()}
                    </div>
                  </div>
                )}

                <div className="mt-3 text-[10px] text-slate-400">
                  Click a date to create
                  an event. Click an
                  existing event to edit
                  it.
                </div>
              </div>
            </div>

            {/* TODAY + UPCOMING */}

            <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
              <div className="px-4 py-4 border-b border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Today
                </div>

                <div className="mt-1 text-sm font-bold text-slate-950">
                  {new Date().toLocaleDateString(
                    "en-IN",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }
                  )}
                </div>
              </div>

              <div className="p-4">
                {todayEvents.length ===
                0 ? (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-5 text-center">
                    <CalendarDays
                      size={20}
                      className="mx-auto text-slate-300"
                    />

                    <div className="mt-2 text-xs font-semibold text-slate-700">
                      No events today
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openCreateEvent(
                          new Date()
                        )
                      }
                      className="mt-3 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      + Add event
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayEvents.map(
                      (item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            openEditEvent(
                              item
                            )
                          }
                          className="w-full text-left rounded-xl border border-slate-200 p-3 hover:border-indigo-200 hover:bg-indigo-50/20 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 text-[10px] font-bold text-indigo-600 pt-0.5">
                              {eventTime(
                                item
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-slate-900 truncate">
                                {
                                  item.title
                                }
                              </div>

                              <div className="mt-1 text-[10px] text-slate-500">
                                {typeLabel(
                                  item.type
                                )}
                              </div>

                              {item.assignedTo
                                ?.name && (
                                <div className="mt-1 text-[10px] text-slate-400 truncate">
                                  {
                                    item
                                      .assignedTo
                                      .name
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                )}

                <div className="mt-6 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Upcoming
                </div>

                {upcomingEvents.length ===
                0 ? (
                  <div className="py-5 text-center text-xs text-slate-400">
                    No upcoming events.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map(
                      (item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            openEditEvent(
                              item
                            )
                          }
                          className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="w-10 text-center flex-shrink-0">
                            <div className="text-[9px] font-bold text-indigo-600 uppercase">
                              {new Date(
                                item.startAt
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  month:
                                    "short",
                                }
                              )}
                            </div>

                            <div className="text-base font-bold text-slate-950">
                              {new Date(
                                item.startAt
                              ).getDate()}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-900 truncate">
                              {
                                item.title
                              }
                            </div>

                            <div className="mt-0.5 text-[10px] text-slate-500 truncate">
                              {eventTime(
                                item
                              )}{" "}
                              ·{" "}
                              {typeLabel(
                                item.type
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>


            </div>
          </div>
        </div>
      )}

      {eventModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/35 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setEventModalOpen(false);
            }
          }}
        >
          <form
            onSubmit={saveEvent}
            className="w-full max-w-xl max-h-[94vh] sm:max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white border border-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
          >
            <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-950">
                  {editingEvent
                    ? "Edit event"
                    : "Add event"}
                </div>

                <div className="mt-0.5 text-[11px] text-slate-500">
                  Add meetings,
                  follow-ups and
                  important CRM
                  activities.
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEventModalOpen(
                    false
                  )
                }
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-600">
                  Event title *
                </span>

                <input
                  autoFocus
                  value={
                    eventForm.title
                  }
                  onChange={(event) =>
                    setEventForm(
                      (form) => ({
                        ...form,
                        title:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="e.g. Student counselling follow-up"
                  className="mt-1.5 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Starts *
                  </span>

                  <input
                    type="datetime-local"
                    min={
                      editingEvent
                        ? undefined
                        : minimumDateTimeLocal()
                    }
                    value={
                      eventForm.startAt
                    }
                    onChange={(event) =>
                      setEventForm(
                        (form) => ({
                          ...form,
                          startAt:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="mt-1.5 w-full h-10 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
                  />
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Ends
                  </span>

                  <input
                    type="datetime-local"
                    min={
                      eventForm.startAt ||
                      minimumDateTimeLocal()
                    }
                    value={
                      eventForm.endAt
                    }
                    onChange={(event) =>
                      setEventForm(
                        (form) => ({
                          ...form,
                          endAt:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="mt-1.5 w-full h-10 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    eventForm.allDay
                  }
                  onChange={(event) =>
                    setEventForm(
                      (form) => ({
                        ...form,
                        allDay:
                          event.target
                            .checked,
                      })
                    )
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />

                <span className="text-xs font-medium text-slate-600">
                  All-day event
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Type
                  </span>

                  <select
                    value={
                      eventForm.type
                    }
                    onChange={(event) =>
                      setEventForm(
                        (form) => ({
                          ...form,
                          type:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="mt-1.5 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:border-indigo-400"
                  >
                    {EVENT_TYPES.map(
                      (type) => (
                        <option
                          key={
                            type.value
                          }
                          value={
                            type.value
                          }
                        >
                          {
                            type.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Status
                  </span>

                  <select
                    value={
                      eventForm.status
                    }
                    onChange={(event) =>
                      setEventForm(
                        (form) => ({
                          ...form,
                          status:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="mt-1.5 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:border-indigo-400"
                  >
                    <option value="SCHEDULED">
                      Scheduled
                    </option>

                    <option value="COMPLETED">
                      Completed
                    </option>

                    <option value="CANCELLED">
                      Cancelled
                    </option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                  <UserRound
                    size={12}
                  />

                  Assign to
                </span>

                <select
                  value={
                    eventForm.assignedToUserId
                  }
                  onChange={(event) =>
                    setEventForm(
                      (form) => ({
                        ...form,
                        assignedToUserId:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="mt-1.5 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:border-indigo-400"
                >
                  <option value="">
                    Unassigned
                  </option>

                  {calendarUsers.map(
                    (member) => (
                      <option
                        key={
                          member.id
                        }
                        value={
                          member.id
                        }
                      >
                        {member.name} ·{" "}
                        {member.role
                          ?.replaceAll(
                            "_",
                            " "
                          )}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                  <MapPin size={12} />

                  Location
                </span>

                <input
                  value={
                    eventForm.location
                  }
                  onChange={(event) =>
                    setEventForm(
                      (form) => ({
                        ...form,
                        location:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Office, Google Meet, Hyderabad..."
                  className="mt-1.5 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold text-slate-600">
                  Notes
                </span>

                <textarea
                  rows="3"
                  value={
                    eventForm.description
                  }
                  onChange={(event) =>
                    setEventForm(
                      (form) => ({
                        ...form,
                        description:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Add agenda, follow-up details or notes..."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none resize-none focus:border-indigo-400"
                />
              </label>

              {editingEvent
                ?.assignedTo && (
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2
                    size={14}
                    className="text-emerald-500"
                  />

                  Currently assigned
                  to{" "}
                  <span className="font-semibold text-slate-800">
                    {
                      editingEvent
                        .assignedTo
                        .name
                    }
                  </span>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                {editingEvent && (
                  <button
                    type="button"
                    disabled={
                      deletingEventId ===
                      editingEvent.id
                    }
                    onClick={() =>
                      deleteEvent(
                        editingEvent.id
                      )
                    }
                    className="h-9 px-3 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {deletingEventId ===
                    editingEvent.id ? (
                      <Loader2
                        size={13}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2
                        size={13}
                      />
                    )}

                    Delete
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEventModalOpen(
                      false
                    )
                  }
                  className="h-9 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    savingEvent ||
                    !eventForm.title.trim() ||
                    !eventForm.startAt
                  }
                  className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {savingEvent ? (
                    <Loader2
                      size={13}
                      className="animate-spin"
                    />
                  ) : editingEvent ? (
                    <Pencil size={13} />
                  ) : (
                    <Plus size={13} />
                  )}

                  {editingEvent
                    ? "Save changes"
                    : "Create event"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}