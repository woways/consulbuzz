import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Ticket,
  Wrench,
  X,
} from "lucide-react";

import {
  Badge,
  StatCard,
} from "../../components/ui";

import { apiRequest } from "../../lib/api";

const STATUS_OPTIONS = [
  {
    value: "NEW",
    label: "New",
  },
  {
    value: "UNDER_REVIEW",
    label: "Under Review",
  },
  {
    value: "APPROVED",
    label: "Approved",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
  },
  {
    value: "DEVELOPMENT",
    label: "Development",
  },
  {
    value: "COMPLETED",
    label: "Completed",
  },
  {
    value: "REJECTED",
    label: "Rejected",
  },
  {
    value: "CLOSED",
    label: "Closed",
  },
];

function priorityTone(priority) {
  if (
    priority === "URGENT" ||
    priority === "HIGH"
  ) {
    return "rose";
  }

  if (priority === "MEDIUM") {
    return "amber";
  }

  return "slate";
}

function statusTone(status) {
  if (
    ["COMPLETED", "CLOSED"].includes(
      status
    )
  ) {
    return "emerald";
  }

  if (
    [
      "IN_PROGRESS",
      "DEVELOPMENT",
      "APPROVED",
    ].includes(status)
  ) {
    return "sky";
  }

  if (status === "REJECTED") {
    return "rose";
  }

  return "amber";
}

function planTone(plan) {
  if (plan === "advanced") {
    return "amber";
  }

  if (plan === "pro") {
    return "indigo";
  }

  return "slate";
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function TicketDrawer({
  ticket,
  onClose,
  onUpdated,
}) {
  const [status, setStatus] =
    useState(ticket.status);

  const [
    adminRemarks,
    setAdminRemarks,
  ] = useState(
    ticket.adminRemarks || ""
  );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function save() {
    setSaving(true);
    setError("");

    try {
      const data =
        await apiRequest(
          `/api/admin/support/${ticket.id}`,
          {
            method: "PATCH",

            body: JSON.stringify({
              status,
              adminRemarks,
            }),
          }
        );

      onUpdated(data.ticket);
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to update ticket"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex justify-end">
      <div className="w-full max-w-xl h-full bg-white border-l border-slate-200 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-5 flex justify-between z-10">
          <div>
            <div className="text-xs font-mono text-slate-500">
              {ticket.ticketNumber}
            </div>

            <h2 className="text-lg font-bold tracking-tight text-slate-950 mt-1">
              {ticket.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Info
              label="Company"
              value={
                ticket.company?.name ||
                "—"
              }
            />

            <Info
              label="Plan"
              value={
                ticket.company?.planName ||
                ticket.company?.plan ||
                "—"
              }
            />

            <Info
              label="Type"
              value={ticket.typeLabel}
            />

            <Info
              label="Priority"
              value={
                ticket.priorityLabel
              }
            />

            <Info
              label="Submitted By"
              value={
                ticket.submittedByName ||
                "—"
              }
            />

            <Info
              label="Submitted Email"
              value={
                ticket.submittedByEmail ||
                "—"
              }
            />

            <Info
              label="Created"
              value={formatDate(
                ticket.createdAt
              )}
            />

            <Info
              label="Last Updated"
              value={formatDate(
                ticket.updatedAt
              )}
            />
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Client Request
            </div>

            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Status
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors"
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              ConsulBuzz Remarks
            </label>

            <textarea
              rows={5}
              value={adminRemarks}
              onChange={(event) =>
                setAdminRemarks(
                  event.target.value
                )
              }
              placeholder="Add remarks about this support request..."
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors"
            />
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            This screen contains only
            support and account context.
            ConsulBuzz does not need
            access to the client's leads,
            admissions, revenue or other
            operational CRM records.
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
            >
              {saving && (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              )}

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="text-sm font-medium text-slate-900 mt-1 break-words">
        {value}
      </div>
    </div>
  );
}

export default function Support() {
  const [data, setData] =
    useState({
      summary: {},
      tickets: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  const [scope, setScope] =
    useState("support");

  const [
    selectedTicket,
    setSelectedTicket,
  ] = useState(null);

  async function loadTickets() {
    setLoading(true);
    setError("");

    try {
      const result =
        await apiRequest(
          `/api/admin/support?scope=${scope}`
        );

      setData(result);
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to load support tickets"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setFilter("all");
    setSelectedTicket(null);
    loadTickets();
  }, [scope]);

  const filteredTickets =
    useMemo(() => {
      let tickets =
        data.tickets || [];

      if (filter === "new") {
        tickets = tickets.filter(
          (ticket) =>
            ticket.status === "NEW"
        );
      }

      if (
        filter === "active"
      ) {
        tickets = tickets.filter(
          (ticket) =>
            [
              "UNDER_REVIEW",
              "APPROVED",
              "IN_PROGRESS",
              "DEVELOPMENT",
            ].includes(ticket.status)
        );
      }

      if (
        filter === "technical"
      ) {
        tickets = tickets.filter(
          (ticket) =>
            ticket.type ===
            "TECHNICAL_ISSUE"
        );
      }

      if (
        filter === "billing"
      ) {
        tickets = tickets.filter(
          (ticket) =>
            ticket.type === "BILLING"
        );
      }

      if (
        filter === "completed"
      ) {
        tickets = tickets.filter(
          (ticket) =>
            [
              "COMPLETED",
              "CLOSED",
            ].includes(ticket.status)
        );
      }

      const query = search
        .trim()
        .toLowerCase();

      if (query) {
        tickets = tickets.filter(
          (ticket) =>
            ticket.ticketNumber
              ?.toLowerCase()
              .includes(query) ||
            ticket.title
              ?.toLowerCase()
              .includes(query) ||
            ticket.company?.name
              ?.toLowerCase()
              .includes(query) ||
            ticket.typeLabel
              ?.toLowerCase()
              .includes(query)
        );
      }

      return tickets;
    }, [
      data.tickets,
      filter,
      search,
    ]);

  function handleUpdated(
    updated
  ) {
    setData((current) => ({
      ...current,

      tickets:
        current.tickets.map(
          (ticket) =>
            ticket.id ===
            updated.id
              ? updated
              : ticket
        ),
    }));

    setSelectedTicket(
      updated
    );

    loadTickets();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {scope === "support"
              ? "Support Management"
              : "Customization Requests"}
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            {scope === "support"
              ? "Manage technical issues and billing support requests from client companies."
              : "Review customization requests from Advanced-plan client companies."}
          </p>
        </div>

        <button
          type="button"
          onClick={loadTickets}
          disabled={loading}
          className="h-9 px-3.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RefreshCw
            size={13}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-2 inline-flex items-center gap-1 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <button
          type="button"
          onClick={() =>
            setScope("support")
          }
          className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-2 ${
            scope === "support"
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Ticket size={13} />
          Support
        </button>

        <button
          type="button"
          onClick={() =>
            setScope("customization")
          }
          className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-2 ${
            scope === "customization"
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Wrench size={13} />
          Customization
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Tickets"
          value={
            data.summary?.total ||
            0
          }
          icon={Ticket}
          tone="indigo"
        />

        <StatCard
          label="New"
          value={
            data.summary?.new || 0
          }
          icon={AlertCircle}
          tone="amber"
        />

        <StatCard
          label="Under Review"
          value={
            data.summary
              ?.underReview || 0
          }
          icon={Clock}
        />

        <StatCard
          label="Active"
          value={
            data.summary?.active ||
            0
          }
          icon={Clock}
          tone="indigo"
        />

        <StatCard
          label="Completed"
          value={
            data.summary
              ?.completed || 0
          }
          icon={CheckCircle2}
          tone="emerald"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        {(scope === "support"
          ? [
              ["all", "All"],
              ["new", "New"],
              ["active", "Active"],
              ["technical", "Technical Issues"],
              ["billing", "Billing"],
              ["completed", "Completed"],
            ]
          : [
              ["all", "All"],
              ["new", "New"],
              ["active", "Active"],
              ["completed", "Completed"],
            ]
        ).map(
          ([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                setFilter(key)
              }
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
                filter === key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          )
        )}

        <div className="relative ml-auto w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search tickets or company..."
            className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl py-20 flex justify-center gap-2 text-sm text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <Loader2
            size={16}
            className="animate-spin"
          />

          Loading support tickets...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  Ticket
                </th>

                <th className="px-4 py-3 text-left">
                  Client
                </th>

                <th className="px-4 py-3 text-left">
                  Type
                </th>

                <th className="px-4 py-3 text-left">
                  Priority
                </th>

                <th className="px-4 py-3 text-left">
                  Plan
                </th>

                <th className="px-4 py-3 text-left">
                  Status
                </th>

                <th className="px-4 py-3 text-left">
                  Created
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredTickets.map(
                (ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() =>
                      setSelectedTicket(
                        ticket
                      )
                    }
                    className="border-t border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {ticket.title}
                      </div>

                      <div className="text-xs font-mono text-slate-500 mt-0.5">
                        {
                          ticket.ticketNumber
                        }
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {ticket.company
                          ?.name ||
                          "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone="slate">
                        {
                          ticket.typeLabel
                        }
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        tone={priorityTone(
                          ticket.priority
                        )}
                      >
                        {
                          ticket.priorityLabel
                        }
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        tone={planTone(
                          ticket.company
                            ?.plan
                        )}
                      >
                        {ticket.company
                          ?.planName ||
                          ticket.company
                            ?.plan ||
                          "No Plan"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        tone={statusTone(
                          ticket.status
                        )}
                      >
                        {
                          ticket.statusLabel
                        }
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(
                        ticket.createdAt
                      )}
                    </td>
                  </tr>
                )
              )}

              {!filteredTickets.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No support tickets
                    found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedTicket && (
        <TicketDrawer
          ticket={
            selectedTicket
          }
          onClose={() =>
            setSelectedTicket(
              null
            )
          }
          onUpdated={
            handleUpdated
          }
        />
      )}
    </div>
  );
}
