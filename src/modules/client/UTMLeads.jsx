import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Layers,
  Link2,
  FileSpreadsheet,
  Globe,
  MessageSquare,
  Instagram,
  Copy,
  MoreVertical,
  Search,
  RefreshCw,
  X,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import {
  Table,
  Badge,
  stageTone,
} from "../../components/ui";

import { apiRequest } from "../../lib/api";

const SOURCES = [
  {
    value: "GOOGLE_FORM",
    label: "Google Form",
  },
  {
    value: "WEBSITE_FORM",
    label: "Website Form",
  },
  {
    value: "IM_LEADS",
    label: "IM Leads",
  },
  {
    value: "DM_LEADS",
    label: "DM Leads",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

const STAGES = [
  {
    value: "NEW",
    label: "New",
  },
  {
    value: "CONTACTED",
    label: "Contacted",
  },
  {
    value: "QUALIFIED",
    label: "Qualified",
  },
  {
    value: "COUNSELLING",
    label: "Counselling",
  },
  {
    value: "ADMITTED",
    label: "Admitted",
  },
  {
    value: "LOST",
    label: "Lost",
  },
];

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (
    Number.isNaN(parsed.getTime())
  ) {
    return "—";
  }

  return parsed.toLocaleString(
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

function LeadModal({
  onClose,
  onCreated,
}) {
  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      name: "",
      phone: "",
      email: "",
      course: "",
      source: "GOOGLE_FORM",
      stage: "NEW",
      campaign: "",
      medium: "",
      assignedToName: "",
      notes: "",
    });

  function update(
    key,
    value
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const data =
        await apiRequest(
          "/api/client/leads",
          {
            method: "POST",

            body: JSON.stringify(
              form
            ),
          }
        );

      onCreated(data.lead);
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to create lead"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              New Lead
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              Add a lead to your
              company CRM.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500"
          >
            <X size={17} />
          </button>
        </div>

        <form
          onSubmit={submit}
          className="overflow-y-auto max-h-[calc(92vh-72px)]"
        >
          <div className="p-5">
            {error && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 border border-rose-200 bg-rose-50 rounded-lg text-sm text-rose-700">
                <AlertCircle
                  size={14}
                />

                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Lead Name"
                required
                value={form.name}
                onChange={(value) =>
                  update(
                    "name",
                    value
                  )
                }
                placeholder="Student / customer name"
              />

              <Field
                label="Phone"
                required
                value={form.phone}
                onChange={(value) =>
                  update(
                    "phone",
                    value
                  )
                }
                placeholder="9876543210"
              />

              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  update(
                    "email",
                    value
                  )
                }
                placeholder="student@email.com"
              />

              <Field
                label="Course / Interest"
                value={form.course}
                onChange={(value) =>
                  update(
                    "course",
                    value
                  )
                }
                placeholder="MBBS Abroad"
              />

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Source
                  <span className="text-rose-500 ml-0.5">
                    *
                  </span>
                </label>

                <select
                  value={form.source}
                  onChange={(event) =>
                    update(
                      "source",
                      event.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
                >
                  {SOURCES.map(
                    (source) => (
                      <option
                        key={
                          source.value
                        }
                        value={
                          source.value
                        }
                      >
                        {source.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Stage
                </label>

                <select
                  value={form.stage}
                  onChange={(event) =>
                    update(
                      "stage",
                      event.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
                >
                  {STAGES.map(
                    (stage) => (
                      <option
                        key={
                          stage.value
                        }
                        value={
                          stage.value
                        }
                      >
                        {stage.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <Field
                label="Campaign"
                value={
                  form.campaign
                }
                onChange={(value) =>
                  update(
                    "campaign",
                    value
                  )
                }
                placeholder="MBBS-Ukraine-Q4"
              />

              <Field
                label="Medium"
                value={form.medium}
                onChange={(value) =>
                  update(
                    "medium",
                    value
                  )
                }
                placeholder="Meta Ads"
              />

              <Field
                label="Assigned To"
                value={
                  form.assignedToName
                }
                onChange={(value) =>
                  update(
                    "assignedToName",
                    value
                  )
                }
                placeholder="Counsellor name"
              />

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    update(
                      "notes",
                      event.target.value
                    )
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  placeholder="Optional notes"
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-slate-200 rounded-md text-sm text-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-sm inline-flex items-center gap-2"
            >
              {saving && (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              )}

              {saving
                ? "Creating..."
                : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LinkModal({
  onClose,
  onCreated,
}) {
  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      campaign: "",
      source: "",
      medium: "",
      url: "",
    });

  function update(
    key,
    value
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const data =
        await apiRequest(
          "/api/client/leads/utm/links",
          {
            method: "POST",

            body: JSON.stringify(
              form
            ),
          }
        );

      onCreated(data.link);
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to create UTM link"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              New UTM Link
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              Create a campaign
              tracking link record.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-500"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            {error && (
              <div className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <Field
              label="Campaign"
              required
              value={form.campaign}
              onChange={(value) =>
                update(
                  "campaign",
                  value
                )
              }
              placeholder="MBBS-Ukraine-Q4"
            />

            <Field
              label="Source"
              required
              value={form.source}
              onChange={(value) =>
                update(
                  "source",
                  value
                )
              }
              placeholder="meta"
            />

            <Field
              label="Medium"
              required
              value={form.medium}
              onChange={(value) =>
                update(
                  "medium",
                  value
                )
              }
              placeholder="cpc"
            />

            <Field
              label="URL"
              required
              value={form.url}
              onChange={(value) =>
                update(
                  "url",
                  value
                )
              }
              placeholder="https://example.com/..."
            />
          </div>

          <div className="border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-md text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm inline-flex items-center gap-2"
            >
              {saving && (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              )}

              Create Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  value,
  onChange,
  type = "text",
  placeholder,
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}

        {required && (
          <span className="text-rose-500 ml-0.5">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
    </div>
  );
}

export default function UTMLeads() {
  const [sub, setSub] =
    useState("all");

  const [leads, setLeads] =
    useState([]);

  const [links, setLinks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    showLeadModal,
    setShowLeadModal,
  ] = useState(false);

  const [
    showLinkModal,
    setShowLinkModal,
  ] = useState(false);

  const subs = [
    {
      k: "all",
      label: "All Leads",
      icon: Layers,
    },
    {
      k: "links",
      label: "Links",
      icon: Link2,
    },
    {
      k: "google-form",
      label: "Google Form",
      icon: FileSpreadsheet,
    },
    {
      k: "website-form",
      label: "Website Form",
      icon: Globe,
    },
    {
      k: "im",
      label: "IM Leads",
      icon: MessageSquare,
    },
    {
      k: "dm",
      label: "DM Leads",
      icon: Instagram,
    },
  ];

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        leadsData,
        linksData,
      ] = await Promise.all([
        apiRequest(
          "/api/client/leads"
        ),

        apiRequest(
          "/api/client/leads/utm/links"
        ),
      ]);

      setLeads(
        leadsData.leads || []
      );

      setLinks(
        linksData.links || []
      );
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to load UTM leads"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered =
    useMemo(() => {
      let result = leads;

      if (
        sub === "google-form"
      ) {
        result = result.filter(
          (lead) =>
            lead.sourceKey ===
            "GOOGLE_FORM"
        );
      }

      if (
        sub === "website-form"
      ) {
        result = result.filter(
          (lead) =>
            lead.sourceKey ===
            "WEBSITE_FORM"
        );
      }

      if (sub === "im") {
        result = result.filter(
          (lead) =>
            lead.sourceKey ===
            "IM_LEADS"
        );
      }

      if (sub === "dm") {
        result = result.filter(
          (lead) =>
            lead.sourceKey ===
            "DM_LEADS"
        );
      }

      const query = search
        .trim()
        .toLowerCase();

      if (query) {
        result = result.filter(
          (lead) =>
            lead.name
              ?.toLowerCase()
              .includes(query) ||
            lead.phone
              ?.toLowerCase()
              .includes(query) ||
            lead.course
              ?.toLowerCase()
              .includes(query) ||
            lead.campaign
              ?.toLowerCase()
              .includes(query)
        );
      }

      return result;
    }, [leads, sub, search]);

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(
        url
      );
    } catch {
      // Clipboard may be unavailable.
    }
  }

  function handleLeadCreated(
    lead
  ) {
    setLeads((current) => [
      lead,
      ...current,
    ]);

    setShowLeadModal(false);
  }

  function handleLinkCreated(
    link
  ) {
    setLinks((current) => [
      link,
      ...current,
    ]);

    setShowLinkModal(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Leads / Campaign tracking
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            UTM Leads
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track, filter and manage leads across every campaign source and medium.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {sub === "links" && (
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-2 shadow-sm"
            >
              <Link2 size={14} />
              New Link
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowLeadModal(true)}
            className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 shadow-sm"
          >
            <Plus size={14} />
            New Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Total Leads", leads.length, Users],
          ["Google Form", leads.filter((lead) => lead.sourceKey === "GOOGLE_FORM").length, FileSpreadsheet],
          ["Website Form", leads.filter((lead) => lead.sourceKey === "WEBSITE_FORM").length, Globe],
          ["UTM Links", links.length, Link2],
        ].map(([label, value, Icon]) => (
          <div
            key={label}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {label}
                </div>
                <div className="mt-1.5 text-xl font-bold tracking-tight text-slate-950">
                  {value}
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                <Icon size={15} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl px-2 flex gap-1 overflow-x-auto shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        {subs.map((item) => {
          const Icon =
            item.icon;

          return (
            <button
              key={item.k}
              onClick={() =>
                setSub(item.k)
              }
              className={`px-3 py-3 text-xs font-semibold inline-flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
                sub === item.k
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon size={13} />
              {item.label}
            </button>
          );
        })}
      </div>

      {sub !== "links" && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-2.5 top-2.5 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search by name, phone, course or campaign..."
              className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
            />
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="h-9 px-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5"
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
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 border border-rose-200 bg-rose-50 rounded-lg text-sm text-rose-700">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2
            size={16}
            className="animate-spin"
          />

          Loading...
        </div>
      ) : sub === "links" ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <Table
          columns={[
            "Campaign",
            "Source / Medium",
            "Link",
            "Clicks",
            "Regs",
            "Leads",
            "Conv",
            "Adm",
            "Revenue",
          ]}
          empty="No UTM links created yet"
          rows={links.map(
            (link) => (
              <tr
                key={link.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="px-4 py-2.5 text-sm font-medium text-slate-900">
                  {link.campaign}
                </td>

                <td className="px-4 py-2.5 text-sm text-slate-600 capitalize">
                  {link.source} /{" "}
                  {link.medium}
                </td>

                <td className="px-4 py-2.5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 max-w-xs">
                    <span className="truncate">
                      {link.url}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        copyLink(
                          link.url
                        )
                      }
                    >
                      <Copy
                        size={11}
                        className="text-slate-400 hover:text-slate-600"
                      />
                    </button>
                  </div>
                </td>

                <td className="px-4 py-2.5 text-sm text-slate-700">
                  {Number(
                    link.clicks
                  ).toLocaleString(
                    "en-IN"
                  )}
                </td>

                <td className="px-4 py-2.5 text-sm text-slate-700">
                  {link.regs}
                </td>

                <td className="px-4 py-2.5 text-sm text-slate-700">
                  {link.leads}
                </td>

                <td className="px-4 py-2.5 text-sm text-slate-700">
                  {link.conv}
                </td>

                <td className="px-4 py-2.5 text-sm text-emerald-700 font-medium">
                  {link.adm}
                </td>

                <td className="px-4 py-2.5 text-sm text-slate-900 font-semibold">
                  ₹
                  {Number(
                    link.rev
                  ).toLocaleString(
                    "en-IN"
                  )}
                </td>
              </tr>
            )
          )}
        />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <Table
          columns={[
            "Name",
            "Course",
            "Source",
            "Campaign",
            "Stage",
            "Assigned",
            "Created",
            "",
          ]}
          empty="No leads found"
          rows={filtered.map(
            (lead) => (
              <tr
                key={lead.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="px-4 py-2.5">
                  <div className="text-sm font-medium text-slate-900">
                    {lead.name}
                  </div>

                  <div className="text-xs text-slate-500">
                    {lead.phone}
                  </div>
                </td>

                <td className="px-4 py-2.5 text-sm text-slate-700">
                  {lead.course ||
                    "—"}
                </td>

                <td className="px-4 py-2.5 text-sm text-slate-600">
                  {lead.source}
                </td>

                <td className="px-4 py-2.5 text-sm text-slate-600">
                  {lead.campaign ||
                    "—"}
                </td>

                <td className="px-4 py-2.5">
                  <Badge
                    tone={stageTone(
                      lead.stage
                    )}
                  >
                    {lead.stage}
                  </Badge>
                </td>

                <td className="px-4 py-2.5 text-sm text-slate-700">
                  {lead.assigned}
                </td>

                <td className="px-4 py-2.5 text-xs text-slate-500">
                  {formatDate(
                    lead.createdAt
                  )}
                </td>

                <td className="px-4 py-2.5">
                  <button>
                    <MoreVertical
                      size={14}
                      className="text-slate-400"
                    />
                  </button>
                </td>
              </tr>
            )
          )}
        />
        </div>
      )}

      {showLeadModal && (
        <LeadModal
          onClose={() =>
            setShowLeadModal(false)
          }
          onCreated={
            handleLeadCreated
          }
        />
      )}

      {showLinkModal && (
        <LinkModal
          onClose={() =>
            setShowLinkModal(false)
          }
          onCreated={
            handleLinkCreated
          }
        />
      )}
    </div>
  );
}