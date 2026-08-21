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
  Download,
  Pencil,
  Trash2,
  ExternalLink,
  BarChart3,
  MousePointerClick,
  UserPlus,
  UserCheck,
  IndianRupee,
  Check,
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


function buildTrackedUrl({
  url,
  campaign,
  source,
  medium,
}) {
  try {
    const parsed = new URL(url);

    parsed.searchParams.set(
      "utm_campaign",
      String(campaign || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    );

    parsed.searchParams.set(
      "utm_source",
      String(source || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    );

    parsed.searchParams.set(
      "utm_medium",
      String(medium || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    );

    return parsed.toString();
  } catch {
    return "";
  }
}

function LinkModal({
  editing,
  onClose,
  onSaved,
}) {
  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mode, setMode] =
    useState(
      editing ? "manual" : "generate"
    );

  const [form, setForm] =
    useState({
      campaign:
        editing?.campaign || "",
      source:
        editing?.source || "",
      medium:
        editing?.medium || "",
      url:
        editing?.url || "",
    });

  const generatedUrl =
    mode === "generate"
      ? buildTrackedUrl(form)
      : form.url;

  function update(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const payload = {
        mode,
        campaign:
          form.campaign,
        source:
          form.source,
        medium:
          form.medium,
        url:
          mode === "generate"
            ? generatedUrl
            : form.url,
      };

      const data =
        await apiRequest(
          editing
            ? `/api/client/leads/utm/links/${editing.id}`
            : "/api/client/leads/utm/links",
          {
            method:
              editing
                ? "PATCH"
                : "POST",
            body:
              JSON.stringify(
                payload
              ),
          }
        );

      onSaved(
        data.link
      );
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to save UTM link"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">
              {editing
                ? "Edit UTM Link"
                : "Create UTM Link"}
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Generate a tracked URL or save an existing UTM URL manually.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center text-slate-500"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            {error ? (
              <div className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                {error}
              </div>
            ) : null}

            {!editing ? (
              <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() =>
                    setMode(
                      "generate"
                    )
                  }
                  className={`h-8 px-3 rounded-lg text-xs font-semibold ${
                    mode ===
                    "generate"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Generate UTM
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMode(
                      "manual"
                    )
                  }
                  className={`h-8 px-3 rounded-lg text-xs font-semibold ${
                    mode ===
                    "manual"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Manual UTM
                </button>
              </div>
            ) : null}

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
              placeholder="Admissions-2026"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                placeholder="google / instagram / partner"
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
                placeholder="cpc / social / referral"
              />
            </div>

            <Field
              label={
                mode === "generate"
                  ? "Destination URL"
                  : "UTM URL"
              }
              required
              value={form.url}
              onChange={(value) =>
                update(
                  "url",
                  value
                )
              }
              placeholder="https://example.com/admissions"
            />

            {mode ===
              "generate" &&
            generatedUrl ? (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-500">
                  Generated URL
                </div>

                <div className="mt-2 text-xs font-mono text-slate-700 break-all">
                  {generatedUrl}
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200 px-5 py-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-9 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                !form.campaign.trim() ||
                !form.source.trim() ||
                !form.medium.trim() ||
                !form.url.trim() ||
                (mode ===
                  "generate" &&
                  !generatedUrl)
              }
              className="h-9 px-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2"
            >
              {saving ? (
                <Loader2
                  size={13}
                  className="animate-spin"
                />
              ) : editing ? (
                <Check size={13} />
              ) : (
                <Link2 size={13} />
              )}

              {editing
                ? "Save Changes"
                : mode ===
                  "generate"
                ? "Generate & Save"
                : "Save Manual UTM"}
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
        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  detail,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
            {label}
          </div>

          <div className="mt-2 text-[22px] leading-none font-bold text-slate-950">
            {value}
          </div>
        </div>

        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
          <Icon size={16} />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        {detail}
      </div>
    </div>
  );
}

function downloadCsv(rows) {
  const headers = [
    "Campaign",
    "Source",
    "Medium",
    "URL",
    "Clicks",
    "Registrations",
    "Leads",
    "Conversions",
    "Admissions",
    "Revenue",
    "Created",
  ];

  const escape = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [
    headers.map(escape).join(","),
    ...rows.map((link) =>
      [
        link.campaign,
        link.source,
        link.medium,
        link.url,
        link.clicks,
        link.regs,
        link.leads,
        link.conv,
        link.adm,
        link.rev,
        link.createdAt,
      ]
        .map(escape)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob(
    [csv],
    {
      type:
        "text/csv;charset=utf-8;",
    }
  );

  const url =
    URL.createObjectURL(
      blob
    );

  const anchor =
    document.createElement(
      "a"
    );

  anchor.href = url;
  anchor.download =
    "utm-links.csv";

  document.body.appendChild(
    anchor
  );

  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(
    url
  );
}

export default function UTMLeads({
  selectedYear = "all",
}) {
  const [sub, setSub] =
    useState("all");

  const [leads, setLeads] =
    useState([]);

  const [links, setLinks] =
    useState([]);

  const [analytics, setAnalytics] =
    useState({
      summary: {},
      campaignPerformance: [],
      sourcePerformance: [],
      mediumPerformance: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [linkSearch, setLinkSearch] =
    useState("");

  const [sourceFilter, setSourceFilter] =
    useState("");

  const [mediumFilter, setMediumFilter] =
    useState("");

  const [sort, setSort] =
    useState("newest");

  const [
    showLeadModal,
    setShowLeadModal,
  ] = useState(false);

  const [
    showLinkModal,
    setShowLinkModal,
  ] = useState(false);

  const [
    editingLink,
    setEditingLink,
  ] = useState(null);
  const [
    generatorMode,
    setGeneratorMode,
  ] = useState("generate");

  const [
    generatorForm,
    setGeneratorForm,
  ] = useState({
    campaign: "",
    source: "",
    medium: "",
    url: "",
  });

  const [
    generatorSaving,
    setGeneratorSaving,
  ] = useState(false);

  const [
    generatorError,
    setGeneratorError,
  ] = useState("");

  const [
    copiedGenerated,
    setCopiedGenerated,
  ] = useState(false);

  const subs = [
    {
      k: "all",
      label: "All Leads",
      icon: Layers,
    },
    {
      k: "links",
      label: "UTM Links",
      icon: Link2,
    },
    {
      k: "analytics",
      label: "UTM Analytics",
      icon: BarChart3,
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
      const params =
        new URLSearchParams();

      params.set(
        "year",
        selectedYear
      );

      if (linkSearch.trim()) {
        params.set(
          "search",
          linkSearch.trim()
        );
      }

      if (sourceFilter) {
        params.set(
          "source",
          sourceFilter
        );
      }

      if (mediumFilter) {
        params.set(
          "medium",
          mediumFilter
        );
      }

      params.set(
        "sort",
        sort
      );

      const [
        leadsData,
        linksData,
        analyticsData,
      ] = await Promise.all([
        apiRequest(
          `/api/client/leads?year=${encodeURIComponent(selectedYear)}`
        ),
        apiRequest(
          `/api/client/leads/utm/links?${params.toString()}`
        ),
        apiRequest(
          `/api/client/leads/utm/analytics?year=${encodeURIComponent(selectedYear)}`
        ),
      ]);

      setLeads(
        leadsData.leads || []
      );

      setLinks(
        linksData.links || []
      );

      setAnalytics(
        analyticsData || {
          summary: {},
          campaignPerformance: [],
          sourcePerformance: [],
          mediumPerformance: [],
        }
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
  }, [
    selectedYear,
    sort,
  ]);

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

      const query =
        search
          .trim()
          .toLowerCase();

      if (query) {
        result =
          result.filter(
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
    }, [
      leads,
      sub,
      search,
    ]);

  const sourceOptions =
    useMemo(
      () =>
        Array.from(
          new Set(
            links
              .map(
                (link) =>
                  link.source
              )
              .filter(Boolean)
          )
        ).sort(),
      [links]
    );

  const mediumOptions =
    useMemo(
      () =>
        Array.from(
          new Set(
            links
              .map(
                (link) =>
                  link.medium
              )
              .filter(Boolean)
          )
        ).sort(),
      [links]
    );

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

  async function handleLinkSaved(
    link
  ) {
    setShowLinkModal(false);
    setEditingLink(null);
    await loadData();
  }

  async function deleteLink(link) {
    if (
      !window.confirm(
        `Delete UTM link "${link.campaign}"?`
      )
    ) {
      return;
    }

    try {
      await apiRequest(
        `/api/client/leads/utm/links/${link.id}`,
        {
          method:
            "DELETE",
        }
      );

      await loadData();
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to delete UTM link"
      );
    }
  }

  const generatedInlineUrl =
    generatorMode === "generate"
      ? buildTrackedUrl(generatorForm)
      : generatorForm.url;

  function updateGenerator(field, value) {
    setGeneratorForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveGeneratedLink() {
    if (
      !generatorForm.campaign.trim() ||
      !generatorForm.source.trim() ||
      !generatorForm.medium.trim() ||
      !generatorForm.url.trim()
    ) {
      setGeneratorError(
        "Campaign, source, medium and URL are required"
      );
      return;
    }

    if (
      generatorMode === "generate" &&
      !generatedInlineUrl
    ) {
      setGeneratorError(
        "Please enter a valid destination URL"
      );
      return;
    }

    setGeneratorSaving(true);
    setGeneratorError("");

    try {
      await apiRequest(
        "/api/client/leads/utm/links",
        {
          method: "POST",
          body: JSON.stringify({
            mode: generatorMode,
            campaign: generatorForm.campaign,
            source: generatorForm.source,
            medium: generatorForm.medium,
            url:
              generatorMode === "generate"
                ? generatedInlineUrl
                : generatorForm.url,
          }),
        }
      );

      setGeneratorForm({
        campaign: "",
        source: "",
        medium: "",
        url: "",
      });

      setCopiedGenerated(false);
      await loadData();
      setSub("links");
    } catch (error) {
      setGeneratorError(
        error?.data?.message ||
          "Unable to save UTM link"
      );
    } finally {
      setGeneratorSaving(false);
    }
  }

  async function copyGeneratedLink() {
    if (!generatedInlineUrl) return;

    try {
      await navigator.clipboard.writeText(
        generatedInlineUrl
      );
      setCopiedGenerated(true);
      window.setTimeout(
        () => setCopiedGenerated(false),
        1600
      );
    } catch {
      // Clipboard may be unavailable.
    }
  }

  const summary =
    analytics.summary || {};

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
            Student Mentor-style campaign tracking adapted for your ConsulBuzz tenant.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                links
              )
            }
            disabled={
              !links.length
            }
            className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-2"
          >
            <Download size={13} />
            Export
          </button>

          <button
            type="button"
            onClick={() =>
              setShowLeadModal(
                true
              )
            }
            className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 shadow-sm"
          >
            <Plus size={14} />
            New Lead
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-500">
              UTM Generator
            </div>

            <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-slate-950">
              Generate UTM Link
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Create and save campaign tracking links directly from this page.
            </p>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setGeneratorMode("generate")}
              className={`h-8 px-3 rounded-lg text-xs font-semibold ${
                generatorMode === "generate"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Generate UTM
            </button>

            <button
              type="button"
              onClick={() => setGeneratorMode("manual")}
              className={`h-8 px-3 rounded-lg text-xs font-semibold ${
                generatorMode === "manual"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Manual UTM
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {generatorError ? (
            <div className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
              {generatorError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.85fr_0.85fr] gap-4">
            <Field
              label={
                generatorMode === "generate"
                  ? "Destination URL"
                  : "UTM URL"
              }
              required
              value={generatorForm.url}
              onChange={(value) =>
                updateGenerator("url", value)
              }
              placeholder="https://studentmentor.co.in/"
            />

            <Field
              label="Source"
              required
              value={generatorForm.source}
              onChange={(value) =>
                updateGenerator("source", value)
              }
              placeholder="instagram"
            />

            <Field
              label="Medium"
              required
              value={generatorForm.medium}
              onChange={(value) =>
                updateGenerator("medium", value)
              }
              placeholder="social"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 items-end">
            <Field
              label="Campaign"
              required
              value={generatorForm.campaign}
              onChange={(value) =>
                updateGenerator("campaign", value)
              }
              placeholder="August Admissions 2026"
            />

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={saveGeneratedLink}
                disabled={
                  generatorSaving ||
                  !generatorForm.campaign.trim() ||
                  !generatorForm.source.trim() ||
                  !generatorForm.medium.trim() ||
                  !generatorForm.url.trim() ||
                  (generatorMode === "generate" &&
                    !generatedInlineUrl)
                }
                className="h-10 px-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
              >
                {generatorSaving ? (
                  <Loader2
                    size={13}
                    className="animate-spin"
                  />
                ) : (
                  <Link2 size={13} />
                )}

                {generatorMode === "generate"
                  ? "Generate & Save"
                  : "Save Manual UTM"}
              </button>

              <button
                type="button"
                onClick={copyGeneratedLink}
                disabled={!generatedInlineUrl}
                className="h-10 px-4 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-2"
              >
                {copiedGenerated ? (
                  <Check size={13} />
                ) : (
                  <Copy size={13} />
                )}

                {copiedGenerated
                  ? "Copied"
                  : "Copy Link"}
              </button>
            </div>
          </div>

          {generatedInlineUrl ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-500">
                    {generatorMode === "generate"
                      ? "Generated UTM URL"
                      : "Manual UTM URL"}
                  </div>

                  <div className="mt-2 text-xs font-mono text-slate-700 break-all">
                    {generatedInlineUrl}
                  </div>
                </div>

                <a
                  href={generatedInlineUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-white border border-indigo-100 inline-flex items-center justify-center text-indigo-600 hover:bg-indigo-50 flex-shrink-0"
                  title="Open link"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-xs text-slate-500">
              Enter the destination URL, campaign, source and medium to preview the tracked link here.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard
          label="UTM Links"
          value={
            summary.totalUtmLinks ??
            links.length
          }
          icon={Link2}
          detail="Saved campaign links"
        />

        <MetricCard
          label="Registrations"
          value={
            summary.totalRegistrations ??
            links.reduce(
              (sum, link) =>
                sum +
                Number(
                  link.regs || 0
                ),
              0
            )
          }
          icon={UserPlus}
          detail="Tracked registrations"
        />

        <MetricCard
          label="Leads"
          value={
            summary.totalLeads ??
            links.reduce(
              (sum, link) =>
                sum +
                Number(
                  link.leads || 0
                ),
              0
            )
          }
          icon={Users}
          detail="Leads attached to UTM links"
        />

        <MetricCard
          label="Admissions"
          value={
            summary.totalAdmissions ??
            links.reduce(
              (sum, link) =>
                sum +
                Number(
                  link.adm || 0
                ),
              0
            )
          }
          icon={UserCheck}
          detail="Admissions from UTM leads"
        />

        <MetricCard
          label="Revenue"
          value={`₹${Number(
            summary.totalRevenue ??
              links.reduce(
                (sum, link) =>
                  sum +
                  Number(
                    link.rev || 0
                  ),
                0
              )
          ).toLocaleString("en-IN")}`}
          icon={IndianRupee}
          detail="Received admission revenue"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl px-2 flex gap-1 overflow-x-auto shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        {subs.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.k}
              onClick={() =>
                setSub(
                  item.k
                )
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

      {sub === "links" ? (
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col xl:flex-row xl:items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-2.5 top-2.5 text-slate-400"
            />

            <input
              value={linkSearch}
              onChange={(event) =>
                setLinkSearch(
                  event.target.value
                )
              }
              placeholder="Search campaign, source, medium or URL..."
              className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(event) =>
              setSourceFilter(
                event.target.value
              )
            }
            className="h-9 px-3 border border-slate-200 bg-white rounded-lg text-xs text-slate-700"
          >
            <option value="">
              All Sources
            </option>

            {sourceOptions.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

          <select
            value={mediumFilter}
            onChange={(event) =>
              setMediumFilter(
                event.target.value
              )
            }
            className="h-9 px-3 border border-slate-200 bg-white rounded-lg text-xs text-slate-700"
          >
            <option value="">
              All Mediums
            </option>

            {mediumOptions.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

          <select
            value={sort}
            onChange={(event) =>
              setSort(
                event.target.value
              )
            }
            className="h-9 px-3 border border-slate-200 bg-white rounded-lg text-xs text-slate-700"
          >
            <option value="newest">
              Newest
            </option>
            <option value="oldest">
              Oldest
            </option>
            <option value="leads">
              Most Leads
            </option>
            <option value="admissions">
              Most Admissions
            </option>
            <option value="revenue">
              Highest Revenue
            </option>
          </select>

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
            Apply
          </button>
        </div>
      ) : sub !==
        "analytics" ? (
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-2">
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
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-rose-200 bg-rose-50 rounded-lg text-sm text-rose-700">
          <AlertCircle size={15} />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2
            size={16}
            className="animate-spin"
          />
          Loading...
        </div>
      ) : sub ===
        "links" ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
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
              "Actions",
            ]}
            empty="No UTM links created yet"
            rows={links.map(
              (link) => (
                <tr
                  key={link.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <div className="text-sm font-semibold text-slate-900">
                      {link.campaign}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(
                        link.createdAt
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-2.5 text-sm text-slate-600 capitalize">
                    {link.source} /{" "}
                    {link.medium}
                  </td>

                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5 max-w-[300px]">
                      <span className="truncate text-xs font-mono text-slate-600">
                        {link.url}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          copyLink(
                            link.url
                          )
                        }
                        title="Copy"
                      >
                        <Copy
                          size={12}
                          className="text-slate-400 hover:text-indigo-600"
                        />
                      </button>

                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Open"
                      >
                        <ExternalLink
                          size={12}
                          className="text-slate-400 hover:text-indigo-600"
                        />
                      </a>
                    </div>
                  </td>

                  <td className="px-4 py-2.5 text-sm text-slate-700">
                    {Number(
                      link.clicks || 0
                    ).toLocaleString("en-IN")}
                  </td>

                  <td className="px-4 py-2.5 text-sm text-slate-700">
                    {link.regs || 0}
                  </td>

                  <td className="px-4 py-2.5 text-sm text-slate-700">
                    {link.leads || 0}
                  </td>

                  <td className="px-4 py-2.5 text-sm text-slate-700">
                    {link.conv || 0}
                  </td>

                  <td className="px-4 py-2.5 text-sm text-emerald-700 font-semibold">
                    {link.adm || 0}
                  </td>

                  <td className="px-4 py-2.5 text-sm text-slate-900 font-semibold">
                    ₹
                    {Number(
                      link.rev || 0
                    ).toLocaleString("en-IN")}
                  </td>

                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLink(
                            link
                          );
                          setShowLinkModal(
                            true
                          );
                        }}
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteLink(
                            link
                          )
                        }
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          />
        </div>
      ) : sub ===
        "analytics" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              [
                "Top Campaign",
                summary.topCampaign ||
                  "—",
                BarChart3,
              ],
              [
                "Top Source",
                summary.topSource ||
                  "—",
                Globe,
              ],
              [
                "UTM Conversion",
                `${Number(
                  summary.conversionRate ||
                    0
                ).toFixed(1)}%`,
                MousePointerClick,
              ],
            ].map(
              ([
                label,
                value,
                Icon,
              ]) => (
                <MetricCard
                  key={label}
                  label={label}
                  value={value}
                  icon={Icon}
                  detail={`Selected period: ${
                    selectedYear ===
                    "all"
                      ? "All Time"
                      : selectedYear
                  }`}
                />
              )
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {[
              [
                "Campaign Performance",
                analytics.campaignPerformance ||
                  [],
                "campaign",
              ],
              [
                "Source Performance",
                analytics.sourcePerformance ||
                  [],
                "source",
              ],
              [
                "Medium Performance",
                analytics.mediumPerformance ||
                  [],
                "medium",
              ],
            ].map(
              ([
                title,
                rows,
                key,
              ]) => (
                <div
                  key={title}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-sm font-bold text-slate-900">
                      {title}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {rows
                      .slice(0, 8)
                      .map(
                        (row) => (
                          <div
                            key={
                              row[key]
                            }
                            className="px-4 py-3 flex items-center justify-between gap-3"
                          >
                            <div className="text-xs font-semibold text-slate-700 truncate">
                              {
                                row[
                                  key
                                ]
                              }
                            </div>

                            <div className="text-xs font-bold text-slate-950">
                              {row.leads ??
                                row.registrations ??
                                0}
                            </div>
                          </div>
                        )
                      )}

                    {!rows.length ? (
                      <div className="px-4 py-8 text-center text-xs text-slate-500">
                        No data yet.
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
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
                    <MoreVertical
                      size={14}
                      className="text-slate-400"
                    />
                  </td>
                </tr>
              )
            )}
          />
        </div>
      )}

      {showLeadModal ? (
        <LeadModal
          onClose={() =>
            setShowLeadModal(
              false
            )
          }
          onCreated={
            handleLeadCreated
          }
        />
      ) : null}

      {showLinkModal ? (
        <LinkModal
          editing={editingLink}
          onClose={() => {
            setShowLinkModal(
              false
            );
            setEditingLink(
              null
            );
          }}
          onSaved={
            handleLinkSaved
          }
        />
      ) : null}
    </div>
  );
}
