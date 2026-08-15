import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  Trash2,
  Pencil,
  Database,
  Users,
  UserCheck,
  Layers3,
} from "lucide-react";

import {
  Table,
  Badge,
} from "../../components/ui";

import { apiRequest } from "../../lib/api";

const TYPES = [
  {
    key: "external",
    api: "EXTERNAL_DATA",
    label: "External Data",
  },
  {
    key: "offline",
    api: "OFFLINE_LEADGEN",
    label: "Offline LeadGen",
  },
  {
    key: "purchased",
    api: "PURCHASED",
    label: "Purchased",
  },
  {
    key: "uploaded",
    api: "UPLOADED",
    label: "Uploaded",
  },
  {
    key: "assigned",
    api: "ASSIGNED",
    label: "Assigned",
  },
];

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function Field({
  label,
  value,
  onChange,
  required,
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
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors"
      />
    </div>
  );
}

function DatasetModal({
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
      type: "EXTERNAL_DATA",
      sourceName: "",
      leadCount: "",
      assignedTo: "",
      convertedCount: "0",
      uploadedAt:
        new Date()
          .toISOString()
          .slice(0, 10),
      notes: "",
    });

  function update(
    field,
    value
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      await apiRequest(
        "/api/client/lead-store",
        {
          method: "POST",

          body: JSON.stringify({
            ...form,

            leadCount:
              Number(
                form.leadCount || 0
              ),

            convertedCount:
              Number(
                form.convertedCount ||
                  0
              ),
          }),
        }
      );

      onCreated();
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to create dataset"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-white/70 w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">
              Upload Dataset
            </h2>

            <p className="text-xs text-slate-500">
              Add a lead dataset to
              your company Lead Store.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="p-6 grid md:grid-cols-2 gap-4">
            {error && (
              <div className="md:col-span-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                {error}
              </div>
            )}

            <Field
              label="Dataset Name"
              required
              value={form.name}
              onChange={(value) =>
                update(
                  "name",
                  value
                )
              }
              placeholder="NEET 2026 Aspirants"
            />

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Type
              </label>

              <select
                value={form.type}
                onChange={(event) =>
                  update(
                    "type",
                    event.target.value
                  )
                }
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors"
              >
                {TYPES.map(
                  (type) => (
                    <option
                      key={type.api}
                      value={type.api}
                    >
                      {type.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <Field
              label="Source"
              value={
                form.sourceName
              }
              onChange={(value) =>
                update(
                  "sourceName",
                  value
                )
              }
              placeholder="Justdial / Offline Event"
            />

            <Field
              label="Lead Count"
              required
              type="number"
              value={
                form.leadCount
              }
              onChange={(value) =>
                update(
                  "leadCount",
                  value
                )
              }
              placeholder="500"
            />

            <Field
              label="Assigned To"
              value={
                form.assignedTo
              }
              onChange={(value) =>
                update(
                  "assignedTo",
                  value
                )
              }
              placeholder="Team A / Priya"
            />

            <Field
              label="Converted"
              type="number"
              value={
                form.convertedCount
              }
              onChange={(value) =>
                update(
                  "convertedCount",
                  value
                )
              }
              placeholder="0"
            />

            <Field
              label="Uploaded Date"
              type="date"
              value={
                form.uploadedAt
              }
              onChange={(value) =>
                update(
                  "uploadedAt",
                  value
                )
              }
            />

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Notes
              </label>

              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  update(
                    "notes",
                    event.target.value
                  )
                }
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
            >
              {saving && (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              )}

              {saving
                ? "Creating..."
                : "Upload Dataset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function StoreMetric({
  label,
  value,
  icon: Icon,
  detail,
  tone = "indigo",
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-[22px] leading-none font-bold tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${tones[tone] || tones.indigo}`}>
          <Icon size={17} />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        {detail}
      </div>
    </div>
  );
}

export default function LeadStore() {
  const [sub, setSub] =
    useState("external");

  const [datasets, setDatasets] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  async function loadDatasets() {
    setLoading(true);
    setError("");

    try {
      const data =
        await apiRequest(
          "/api/client/lead-store"
        );

      setDatasets(
        data.datasets || []
      );
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to load Lead Store"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDatasets();
  }, []);

  const filtered =
    useMemo(() => {
      const selected =
        TYPES.find(
          (type) =>
            type.key === sub
        );

      if (!selected) {
        return datasets;
      }

      return datasets.filter(
        (dataset) =>
          dataset.type ===
          selected.api
      );
    }, [
      datasets,
      sub,
    ]);

  async function removeDataset(
    id
  ) {
    if (
      !window.confirm(
        "Delete this dataset?"
      )
    ) {
      return;
    }

    try {
      await apiRequest(
        `/api/client/lead-store/${id}`,
        {
          method: "DELETE",
        }
      );

      await loadDatasets();
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to delete dataset"
      );
    }
  }

  const totalLeads = datasets.reduce(
    (sum, dataset) =>
      sum + Number(dataset.count || 0),
    0
  );

  const totalConverted = datasets.reduce(
    (sum, dataset) =>
      sum + Number(dataset.converted || 0),
    0
  );

  const assignedDatasets = datasets.filter(
    (dataset) =>
      dataset.assignedTo &&
      dataset.assignedTo !== "—"
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Data / Lead inventory
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Lead Store
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Organize external, offline, purchased and assigned lead datasets from one workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDatasets}
            disabled={loading}
            className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center gap-2 shadow-sm"
          >
            <RefreshCw
              size={13}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
          >
            <Plus size={14} />
            Upload Dataset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StoreMetric
          label="Datasets"
          value={datasets.length}
          icon={Database}
          detail="Total lead datasets in store"
          tone="indigo"
        />

        <StoreMetric
          label="Stored Leads"
          value={totalLeads.toLocaleString("en-IN")}
          icon={Users}
          detail="Combined leads across datasets"
          tone="slate"
        />

        <StoreMetric
          label="Converted"
          value={totalConverted.toLocaleString("en-IN")}
          icon={UserCheck}
          detail="Conversions recorded from stored data"
          tone="emerald"
        />

        <StoreMetric
          label="Assigned Datasets"
          value={assignedDatasets}
          icon={Layers3}
          detail="Datasets currently assigned to a team"
          tone="amber"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl px-2 flex gap-1 overflow-x-auto shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        {TYPES.map((type) => (
          <button
            key={type.key}
            type="button"
            onClick={() =>
              setSub(type.key)
            }
            className={`px-3 py-3 text-xs font-semibold border-b-2 whitespace-nowrap ${
              sub === type.key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          <AlertCircle
            size={15}
          />
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 flex justify-center gap-2 text-sm text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <Loader2
            size={16}
            className="animate-spin"
          />

          Loading datasets...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <Table
          columns={[
            "Dataset",
            "Type",
            "Source",
            "Count",
            "Uploaded",
            "Assigned To",
            "Converted",
            "Conversion",
            "",
          ]}
          empty="No datasets found"
          rows={filtered.map(
            (dataset) => {
              const conversion =
                dataset.count > 0
                  ? (
                      (dataset.converted /
                        dataset.count) *
                      100
                    ).toFixed(1)
                  : "0.0";

              return (
                <tr
                  key={dataset.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-900">
                    {dataset.name}
                  </td>

                  <td className="px-4 py-2.5">
                    <Badge tone="slate">
                      {
                        dataset.typeLabel
                      }
                    </Badge>
                  </td>

                  <td className="px-4 py-2.5 text-sm text-slate-600">
                    {dataset.sourceName ||
                      "—"}
                  </td>

                  <td className="px-4 py-2.5 text-sm text-slate-700">
                    {Number(
                      dataset.count
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  <td className="px-4 py-2.5 text-sm text-slate-500">
                    {formatDate(
                      dataset.uploadedAt
                    )}
                  </td>

                  <td className="px-4 py-2.5 text-sm text-slate-700">
                    {
                      dataset.assignedTo
                    }
                  </td>

                  <td className="px-4 py-2.5 text-sm text-emerald-700 font-medium">
                    {
                      dataset.converted
                    }
                  </td>

                  <td className="px-4 py-2.5 text-sm">
                    {conversion}%
                  </td>

                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        removeDataset(
                          dataset.id
                        )
                      }
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2
                        size={14}
                      />
                    </button>
                  </td>
                </tr>
              );
            }
          )}
        />
        </div>
      )}

      {showModal && (
        <DatasetModal
          onClose={() =>
            setShowModal(false)
          }
          onCreated={async () => {
            setShowModal(false);
            await loadDatasets();
          }}
        />
      )}
    </div>
  );
}
