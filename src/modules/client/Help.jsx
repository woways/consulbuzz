import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  AlertCircle,
  Sliders,
  DollarSign,
  X,
  Loader2,
  RefreshCw,
  Lock,
  Crown,
  LifeBuoy,
  Ticket,
  Clock3,
  CheckCircle2,
  Search,
  Eye,
  MessageSquareText,
} from "lucide-react";

import {
  Table,
  Badge,
} from "../../components/ui";

import {
  apiRequest,
} from "../../lib/api";

const TYPES = [
  {
    key:
      "TECHNICAL_ISSUE",

    label:
      "Technical Issue",

    description:
      "Report something that is not working correctly.",

    color:
      "bg-rose-50 text-rose-600 border-rose-100",

    icon:
      AlertCircle,

    advancedOnly:
      false,
  },

  {
    key:
      "BILLING",

    label:
      "Billing Support",

    description:
      "Subscription, invoice, renewal or payment support.",

    color:
      "bg-slate-50 text-slate-600 border-slate-200",

    icon:
      DollarSign,

    advancedOnly:
      false,
  },

  {
    key:
      "CUSTOMIZATION",

    label:
      "Customization Request",

    description:
      "Features, fields, workflows, integrations, reports or UI changes.",

    color:
      "bg-amber-50 text-amber-600 border-amber-100",

    icon:
      Sliders,

    advancedOnly:
      true,
  },
];

const PRIORITIES = [
  {
    value:
      "LOW",
    label:
      "Low",
  },

  {
    value:
      "MEDIUM",
    label:
      "Medium",
  },

  {
    value:
      "HIGH",
    label:
      "High",
  },

  {
    value:
      "URGENT",
    label:
      "Urgent",
  },
];

function priorityTone(
  priority
) {
  if (
    priority ===
      "HIGH" ||
    priority ===
      "URGENT"
  ) {
    return "rose";
  }

  if (
    priority ===
    "MEDIUM"
  ) {
    return "amber";
  }

  return "slate";
}

function ticketStatusTone(
  status
) {
  if (
    status ===
      "COMPLETED" ||
    status ===
      "CLOSED"
  ) {
    return "emerald";
  }

  if (
    status ===
      "DEVELOPMENT" ||
    status ===
      "IN_PROGRESS"
  ) {
    return "sky";
  }

  if (
    status ===
    "REJECTED"
  ) {
    return "rose";
  }

  return "amber";
}

function formatDate(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  );
}

function SupportMetric({
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

    rose:
      "bg-rose-50 text-rose-600 border-rose-100",

    slate:
      "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
            {label}
          </div>

          <div className="mt-2 text-[22px] leading-none font-bold tracking-tight text-slate-950">
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

      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        {detail}
      </div>
    </div>
  );
}

function NewTicketModal({
  defaultType,
  plan,
  onClose,
  onCreated,
}) {
  const [
    saving,
    setSaving,
  ] = useState(
    false
  );

  const [
    error,
    setError,
  ] = useState("");

  const availableTypes =
    useMemo(
      () =>
        TYPES.filter(
          (
            type
          ) =>
            !type.advancedOnly ||
            plan ===
              "advanced"
        ),
      [
        plan,
      ]
    );

  const safeDefault =
    availableTypes.some(
      (
        type
      ) =>
        type.key ===
        defaultType
    )
      ? defaultType
      : "TECHNICAL_ISSUE";

  const [
    form,
    setForm,
  ] = useState({
    title: "",
    description: "",
    type:
      safeDefault ||
      "TECHNICAL_ISSUE",
    priority:
      "MEDIUM",
  });

  function update(
    field,
    value
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        [field]:
          value,
      })
    );
  }

  async function submit(
    event
  ) {
    event.preventDefault();

    if (
      saving
    ) {
      return;
    }

    setSaving(
      true
    );

    setError("");

    try {
      await apiRequest(
        "/api/client/support",
        {
          method:
            "POST",

          body:
            JSON.stringify(
              form
            ),
        }
      );

      onCreated();
    } catch (error) {
      setError(
        error
          ?.data
          ?.message ||
          "Unable to create support ticket"
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-white/70 w-full max-w-xl overflow-hidden">

        {/* HEADER */}

        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-bold text-slate-950">
              New Support Ticket
            </h2>

            <p className="text-[13px] text-slate-500 mt-1">
              Submit a request to
              ConsulBuzz support.
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              saving
            }
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X
              size={17}
            />
          </button>
        </div>

        <form
          onSubmit={
            submit
          }
        >
          <div className="p-6 space-y-4">

            {error && (
              <div className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[15px]">
                {
                  error
                }
              </div>
            )}

            {/* TYPE */}

            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                Ticket Type
              </label>

              <select
                value={
                  form.type
                }
                onChange={(
                  event
                ) =>
                  update(
                    "type",
                    event
                      .target
                      .value
                  )
                }
                className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
              >
                {availableTypes.map(
                  (
                    type
                  ) => (
                    <option
                      key={
                        type.key
                      }
                      value={
                        type.key
                      }
                    >
                      {
                        type.label
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            {/* TITLE */}

            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                Title

                <span className="text-rose-500 ml-0.5">
                  *
                </span>
              </label>

              <input
                required
                value={
                  form.title
                }
                onChange={(
                  event
                ) =>
                  update(
                    "title",
                    event
                      .target
                      .value
                  )
                }
                placeholder="Describe your request briefly"
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
              />
            </div>

            {/* PRIORITY */}

            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                Priority
              </label>

              <select
                value={
                  form.priority
                }
                onChange={(
                  event
                ) =>
                  update(
                    "priority",
                    event
                      .target
                      .value
                  )
                }
                className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
              >
                {PRIORITIES.map(
                  (
                    priority
                  ) => (
                    <option
                      key={
                        priority.value
                      }
                      value={
                        priority.value
                      }
                    >
                      {
                        priority.label
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            {/* DESCRIPTION */}

            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                Description

                <span className="text-rose-500 ml-0.5">
                  *
                </span>
              </label>

              <textarea
                required
                rows={
                  5
                }
                value={
                  form.description
                }
                onChange={(
                  event
                ) =>
                  update(
                    "description",
                    event
                      .target
                      .value
                  )
                }
                placeholder={
                  form.type ===
                  "CUSTOMIZATION"
                    ? "Explain the feature, field, workflow, integration, report or UI change you need..."
                    : form.type ===
                      "BILLING"
                    ? "Explain your subscription, invoice, renewal or payment issue..."
                    : "Explain what is not working and what you expected to happen..."
                }
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* FOOTER */}

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex justify-end gap-2">
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
              className="h-9 px-4 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-[13px] font-semibold text-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving
              }
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-semibold inline-flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {saving && (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              )}

              {saving
                ? "Submitting..."
                : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function TicketDetailsModal({
  ticket,
  onClose,
}) {
  if (!ticket) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-hidden bg-white border border-white/70 rounded-2xl shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-mono font-semibold text-slate-500">
              {ticket.ticketNumber}
            </div>

            <h2 className="mt-1 text-xl font-bold text-slate-950 break-words">
              {ticket.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="w-8 h-8 flex-shrink-0 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X
              size={17}
            />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(92vh-80px)] space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone="slate">
              {ticket.typeLabel}
            </Badge>

            <Badge
              tone={priorityTone(
                ticket.priority
              )}
            >
              {ticket.priorityLabel}
            </Badge>

            <Badge
              tone={ticketStatusTone(
                ticket.status
              )}
            >
              {ticket.statusLabel}
            </Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-[13px]">
            <DetailItem
              label="Submitted By"
              value={
                ticket.submittedByName ||
                "—"
              }
            />

            <DetailItem
              label="Submitted Email"
              value={
                ticket.submittedByEmail ||
                "—"
              }
            />

            <DetailItem
              label="Created"
              value={
                formatDate(
                  ticket.createdAt
                )
              }
            />

            <DetailItem
              label="Last Updated"
              value={
                formatDate(
                  ticket.updatedAt
                )
              }
            />

            {ticket.resolvedAt && (
              <DetailItem
                label="Resolved"
                value={
                  formatDate(
                    ticket.resolvedAt
                  )
                }
              />
            )}
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-400">
              Description
            </div>

            <div className="mt-2 text-[15px] leading-6 text-slate-700 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-xl p-4">
              {ticket.description}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-400 inline-flex items-center gap-1.5">
              <MessageSquareText
                size={12}
              />
              ConsulBuzz Response
            </div>

            {ticket.adminRemarks ? (
              <div className="mt-2 text-[15px] leading-6 text-slate-700 whitespace-pre-wrap bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
                {ticket.adminRemarks}
              </div>
            ) : (
              <div className="mt-2 text-[15px] text-slate-500 bg-white border border-dashed border-slate-200 rounded-xl p-4">
                No support response has been added yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-[13px] font-semibold text-slate-700 break-words">
        {value}
      </div>
    </div>
  );
}

export default function Help({
  plan = "basic",
}) {
  const [
    tickets,
    setTickets,
  ] = useState([]);

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

  const [
    showTicketModal,
    setShowTicketModal,
  ] = useState(
    false
  );

  const [
    selectedType,
    setSelectedType,
  ] = useState(
    null
  );

  const [
    selectedTicket,
    setSelectedTicket,
  ] = useState(
    null
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("");

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const isAdvanced =
    plan ===
    "advanced";

  async function loadTickets() {
    setLoading(
      true
    );

    setError("");

    try {
      const data =
        await apiRequest(
          "/api/client/support"
        );

      setTickets(
        data.tickets ||
          []
      );
    } catch (error) {
      setError(
        error
          ?.data
          ?.message ||
          "Unable to load support tickets"
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  function createTicket(
    type = null
  ) {
    if (
      type ===
        "CUSTOMIZATION" &&
      !isAdvanced
    ) {
      return;
    }

    setSelectedType(
      type
    );

    setShowTicketModal(
      true
    );
  }

  const totalTickets =
    tickets.length;

  const openTickets =
    tickets.filter(
      (
        ticket
      ) =>
        ![
          "COMPLETED",
          "CLOSED",
          "REJECTED",
        ].includes(
          ticket.status
        )
    ).length;

  const activeTickets =
    tickets.filter(
      (
        ticket
      ) =>
        [
          "IN_PROGRESS",
          "DEVELOPMENT",
        ].includes(
          ticket.status
        )
    ).length;

  const completedTickets =
    tickets.filter(
      (
        ticket
      ) =>
        [
          "COMPLETED",
          "CLOSED",
        ].includes(
          ticket.status
        )
    ).length;

  const filteredTickets =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return tickets.filter(
          (
            ticket
          ) => {
            const searchMatches =
              !query ||
              [
                ticket.ticketNumber,
                ticket.title,
                ticket.description,
                ticket.typeLabel,
                ticket.statusLabel,
                ticket.submittedByName,
                ticket.submittedByEmail,
                ticket.adminRemarks,
              ]
                .filter(
                  Boolean
                )
                .some(
                  (
                    value
                  ) =>
                    String(
                      value
                    )
                      .toLowerCase()
                      .includes(
                        query
                      )
                );

            const statusMatches =
              !statusFilter ||
              ticket.status ===
                statusFilter;

            const typeMatches =
              !typeFilter ||
              ticket.type ===
                typeFilter;

            const priorityMatches =
              !priorityFilter ||
              ticket.priority ===
                priorityFilter;

            return (
              searchMatches &&
              statusMatches &&
              typeMatches &&
              priorityMatches
            );
          }
        );
      },
      [
        tickets,
        search,
        statusFilter,
        typeFilter,
        priorityFilter,
      ]
    );

  return (
    <div className="space-y-4">

      {/* PAGE HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Support / Service Desk
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Help & Support
          </h1>

          <p className="mt-1 text-[15px] text-slate-500">
            Manage technical issues,
            billing requests and
            Advanced-plan customization
            support.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={
              loadTickets
            }
            disabled={
              loading
            }
            className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-[13px] font-semibold text-slate-700 inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
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

          <button
            type="button"
            onClick={() =>
              createTicket()
            }
            className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm"
          >
            <Plus
              size={14}
            />

            New Ticket
          </button>
        </div>
      </div>

      {/* METRICS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SupportMetric
          label="Total Tickets"
          value={
            totalTickets
          }
          icon={
            Ticket
          }
          detail="All support requests submitted"
          tone="indigo"
        />

        <SupportMetric
          label="Open"
          value={
            openTickets
          }
          icon={
            LifeBuoy
          }
          detail="Requests requiring attention"
          tone="amber"
        />

        <SupportMetric
          label="In Progress"
          value={
            activeTickets
          }
          icon={
            Clock3
          }
          detail="Tickets currently being worked on"
          tone="indigo"
        />

        <SupportMetric
          label="Completed"
          value={
            completedTickets
          }
          icon={
            CheckCircle2
          }
          detail="Resolved or closed support requests"
          tone="emerald"
        />
      </div>

      {/* SUPPORT TYPES */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TYPES.map(
          (
            type
          ) => {
            const Icon =
              type.icon;

            const locked =
              type.advancedOnly &&
              !isAdvanced;

            return (
              <button
                key={
                  type.key
                }
                type="button"
                disabled={
                  locked
                }
                onClick={() =>
                  createTicket(
                    type.key
                  )
                }
                className={`relative bg-white border rounded-xl p-5 text-left transition-all shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${
                  locked
                    ? "border-slate-200 cursor-not-allowed"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
                }`}
              >
                {locked && (
                  <div className="absolute right-4 top-4 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
                    <Lock
                      size={10}
                    />

                    Advanced
                  </div>
                )}

                <div
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-4 ${type.color}`}
                >
                  <Icon
                    size={16}
                  />
                </div>

                <div className="text-[15px] font-bold text-slate-900">
                  {
                    type.label
                  }
                </div>

                <div className="text-[13px] text-slate-500 mt-1.5 leading-relaxed pr-3">
                  {
                    type.description
                  }
                </div>

                {type.advancedOnly &&
                  isAdvanced && (
                    <div className="inline-flex items-center gap-1.5 mt-3 text-[11px] text-amber-700 font-semibold">
                      <Crown
                        size={10}
                      />

                      Advanced capability
                    </div>
                  )}
              </button>
            );
          }
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[15px]">
          {
            error
          }
        </div>
      )}

      {successMessage && (
        <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[15px] inline-flex items-center gap-2">
          <CheckCircle2
            size={15}
          />
          {successMessage}
        </div>
      )}

      {/* SEARCH / FILTERS */}

      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col xl:flex-row xl:items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search ticket number, title, description or response..."
            className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
          />
        </div>

        <select
          value={
            statusFilter
          }
          onChange={(
            event
          ) =>
            setStatusFilter(
              event.target.value
            )
          }
          className="h-9 px-3 border border-slate-200 bg-white rounded-lg text-[13px] font-semibold text-slate-700"
        >
          <option value="">
            All Statuses
          </option>
          <option value="NEW">
            New
          </option>
          <option value="UNDER_REVIEW">
            Under Review
          </option>
          <option value="APPROVED">
            Approved
          </option>
          <option value="IN_PROGRESS">
            In Progress
          </option>
          <option value="DEVELOPMENT">
            Development
          </option>
          <option value="COMPLETED">
            Completed
          </option>
          <option value="REJECTED">
            Rejected
          </option>
          <option value="CLOSED">
            Closed
          </option>
        </select>

        <select
          value={
            typeFilter
          }
          onChange={(
            event
          ) =>
            setTypeFilter(
              event.target.value
            )
          }
          className="h-9 px-3 border border-slate-200 bg-white rounded-lg text-[13px] font-semibold text-slate-700"
        >
          <option value="">
            All Types
          </option>
          <option value="TECHNICAL_ISSUE">
            Technical Issue
          </option>
          <option value="BILLING">
            Billing Support
          </option>
          <option value="CUSTOMIZATION">
            Customization Request
          </option>
        </select>

        <select
          value={
            priorityFilter
          }
          onChange={(
            event
          ) =>
            setPriorityFilter(
              event.target.value
            )
          }
          className="h-9 px-3 border border-slate-200 bg-white rounded-lg text-[13px] font-semibold text-slate-700"
        >
          <option value="">
            All Priorities
          </option>
          {PRIORITIES.map(
            (
              priority
            ) => (
              <option
                key={
                  priority.value
                }
                value={
                  priority.value
                }
              >
                {
                  priority.label
                }
              </option>
            )
          )}
        </select>
      </div>

      {/* TICKETS */}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 flex items-center justify-center gap-2 text-[15px] text-slate-500">
          <Loader2
            size={16}
            className="animate-spin"
          />

          Loading tickets...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">

          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">
                Support Tickets
              </h3>

              <p className="text-[13px] text-slate-500 mt-1">
                Track all requests and
                their current support
                status.
              </p>
            </div>

            <div className="text-[13px] text-slate-500">
              {
                filteredTickets.length
              }{" "}
              records
            </div>
          </div>

          <Table
            columns={[
              "Ticket",
              "Title",
              "Type",
              "Priority",
              "Status",
              "Created",
              "",
            ]}
            empty="No support tickets yet"
            rows={filteredTickets.map(
              (
                ticket
              ) => (
                <tr
                  key={
                    ticket.id
                  }
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-4 py-3 text-[15px] font-mono font-medium text-slate-600 whitespace-nowrap">
                    {
                      ticket.ticketNumber
                    }
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-[15px] font-semibold text-slate-900">
                      {
                        ticket.title
                      }
                    </div>

                    <div className="text-[13px] text-slate-500 mt-1 max-w-md truncate">
                      {
                        ticket.description
                      }
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <Badge
                      tone="slate"
                    >
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
                      tone={ticketStatusTone(
                        ticket.status
                      )}
                    >
                      {
                        ticket.statusLabel
                      }
                    </Badge>
                  </td>

                  <td className="px-4 py-3 text-[13px] text-slate-500 whitespace-nowrap">
                    {formatDate(
                      ticket.createdAt
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTicket(
                          ticket
                        )
                      }
                      className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-[13px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100"
                    >
                      <Eye
                        size={12}
                      />
                      View
                    </button>
                  </td>
                </tr>
              )
            )}
          />
        </div>
      )}

      {/* MODAL */}

      {showTicketModal && (
        <NewTicketModal
          defaultType={
            selectedType
          }
          plan={
            plan
          }
          onClose={() => {
            setShowTicketModal(
              false
            );

            setSelectedType(
              null
            );
          }}
          onCreated={async () => {
            setShowTicketModal(
              false
            );

            setSelectedType(
              null
            );

            setSuccessMessage(
              "Support ticket submitted successfully"
            );

            await loadTickets();
          }}
        />
      )}

      {selectedTicket && (
        <TicketDetailsModal
          ticket={
            selectedTicket
          }
          onClose={() =>
            setSelectedTicket(
              null
            )
          }
        />
      )}
    </div>
  );
}