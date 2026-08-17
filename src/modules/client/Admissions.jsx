import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  UserCheck,
  CalendarDays,
  DollarSign,
  Clock,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  Search,
  WalletCards,
  CircleDollarSign,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  Table,
  Badge,
  statusTone,
} from "../../components/ui";

import { apiRequest } from "../../lib/api";

const STATUS_OPTIONS = [
  {
    value: "PENDING",
    label: "Pending",
  },
  {
    value: "ONGOING",
    label: "Ongoing",
  },
  {
    value: "COMPLETED",
    label: "Completed",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
];

function formatMoney(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;
}

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
  required,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
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
        min={min}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors"
      />
    </div>
  );
}

function AdmissionModal({
  onClose,
  onCreated,
}) {
  const [leads, setLeads] =
    useState([]);

  const [loadingLeads, setLoadingLeads] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      leadId: "",
      studentName: "",
      studentPhone: "",
      studentEmail: "",
      college: "",
      course: "",
      counsellorName: "",
      totalFee: "",
      paidAmount: "",
      status: "ONGOING",
      admissionDate:
        new Date()
          .toISOString()
          .slice(0, 10),
      notes: "",
    });

  useEffect(() => {
    async function loadLeads() {
      try {
        const data =
          await apiRequest(
            "/api/client/admissions/eligible-leads"
          );

        setLeads(
          data.leads || []
        );
      } catch (error) {
        setError(
          error?.data?.message ||
            "Unable to load leads"
        );
      } finally {
        setLoadingLeads(false);
      }
    }

    loadLeads();
  }, []);

  function update(
    field,
    value
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function selectLead(leadId) {
    const selected =
      leads.find(
        (lead) =>
          lead.id === leadId
      );

    if (!selected) {
      setForm((current) => ({
        ...current,
        leadId: "",
      }));

      return;
    }

    setForm((current) => ({
      ...current,

      leadId:
        selected.id,

      studentName:
        selected.name || "",

      studentPhone:
        selected.phone || "",

      studentEmail:
        selected.email || "",

      course:
        selected.course || "",

      counsellorName:
        selected.assignedToName ||
        "",
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
          "/api/client/admissions",
          {
            method: "POST",

            body: JSON.stringify({
              ...form,

              totalFee:
                Number(
                  form.totalFee ||
                    0
                ),

              paidAmount:
                Number(
                  form.paidAmount ||
                    0
                ),
            }),
          }
        );

      onCreated(
        data.admission
      );
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to create admission"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden border border-white/70">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              New Admission
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              Convert an existing lead
              or create a direct
              admission.
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
          <div className="p-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700">
                <AlertCircle
                  size={14}
                />

                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Existing Lead
              </label>

              <select
                value={form.leadId}
                disabled={loadingLeads}
                onChange={(event) =>
                  selectLead(
                    event.target.value
                  )
                }
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors"
              >
                <option value="">
                  Direct admission /
                  no lead
                </option>

                {leads.map(
                  (lead) => (
                    <option
                      key={lead.id}
                      value={lead.id}
                    >
                      {lead.name} —{" "}
                      {lead.phone}
                      {lead.course
                        ? ` — ${lead.course}`
                        : ""}
                    </option>
                  )
                )}
              </select>

              <div className="text-[11px] text-slate-500 mt-1">
                Selecting a lead
                automatically fills its
                available details.
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Student Name"
                required
                value={
                  form.studentName
                }
                onChange={(value) =>
                  update(
                    "studentName",
                    value
                  )
                }
                placeholder="Student name"
              />

              <Field
                label="Phone"
                value={
                  form.studentPhone
                }
                onChange={(value) =>
                  update(
                    "studentPhone",
                    value
                  )
                }
                placeholder="9876543210"
              />

              <Field
                label="Email"
                type="email"
                value={
                  form.studentEmail
                }
                onChange={(value) =>
                  update(
                    "studentEmail",
                    value
                  )
                }
                placeholder="student@email.com"
              />

              <Field
                label="Course"
                required
                value={form.course}
                onChange={(value) =>
                  update(
                    "course",
                    value
                  )
                }
                placeholder="MBBS / MBA / BDS..."
              />

              <Field
                label="College / University"
                required
                value={
                  form.college
                }
                onChange={(value) =>
                  update(
                    "college",
                    value
                  )
                }
                placeholder="College name"
              />

              <Field
                label="Counsellor"
                value={
                  form.counsellorName
                }
                onChange={(value) =>
                  update(
                    "counsellorName",
                    value
                  )
                }
                placeholder="Counsellor name"
              />

              <Field
                label="Total Fee"
                required
                type="number"
                min="0"
                value={
                  form.totalFee
                }
                onChange={(value) =>
                  update(
                    "totalFee",
                    value
                  )
                }
                placeholder="400000"
              />

              <Field
                label="Paid Amount"
                required
                type="number"
                min="0"
                value={
                  form.paidAmount
                }
                onChange={(value) =>
                  update(
                    "paidAmount",
                    value
                  )
                }
                placeholder="100000"
              />

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Admission Status
                </label>

                <select
                  value={
                    form.status
                  }
                  onChange={(event) =>
                    update(
                      "status",
                      event.target.value
                    )
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors"
                >
                  {STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        key={
                          status.value
                        }
                        value={
                          status.value
                        }
                      >
                        {status.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <Field
                label="Admission Date"
                required
                type="date"
                value={
                  form.admissionDate
                }
                onChange={(value) =>
                  update(
                    "admissionDate",
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
                  placeholder="Optional admission notes"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 px-6 py-4 border-t border-slate-200 bg-white/95 backdrop-blur flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-9 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
                : "Create Admission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function EditAdmissionModal({
  admission,
  onClose,
  onSaved,
}) {
  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      studentName:
        admission.name || "",
      studentPhone:
        admission.phone || "",
      studentEmail:
        admission.email || "",
      college:
        admission.college || "",
      course:
        admission.course || "",
      counsellorName:
        admission.counsellor === "Unassigned"
          ? ""
          : admission.counsellor || "",
      totalFee:
        String(admission.total ?? ""),
      paidAmount:
        String(admission.paid ?? ""),
      status:
        admission.statusKey || "ONGOING",
      admissionDate:
        admission.admissionDate
          ? new Date(admission.admissionDate)
              .toISOString()
              .slice(0, 10)
          : "",
      notes:
        admission.notes || "",
    });

  function update(field, value) {
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
        `/api/client/admissions/${admission.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            ...form,
            totalFee: Number(form.totalFee || 0),
            paidAmount: Number(form.paidAmount || 0),
          }),
        }
      );

      onSaved();
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to update admission"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden border border-white/70">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Edit Admission
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update student, payment and admission status details.
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
          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {admission.leadId && (
              <div className="px-3 py-2.5 rounded-lg border border-indigo-100 bg-indigo-50/60 text-xs text-indigo-800">
                This admission is linked to a CRM lead. Cancelling or deleting it will restore that lead to its previous stage.
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Student Name" required value={form.studentName} onChange={(value) => update("studentName", value)} />
              <Field label="Phone" value={form.studentPhone} onChange={(value) => update("studentPhone", value)} />
              <Field label="Email" type="email" value={form.studentEmail} onChange={(value) => update("studentEmail", value)} />
              <Field label="Course" required value={form.course} onChange={(value) => update("course", value)} />
              <Field label="College / University" required value={form.college} onChange={(value) => update("college", value)} />
              <Field label="Counsellor" value={form.counsellorName} onChange={(value) => update("counsellorName", value)} />
              <Field label="Total Fee" required type="number" min="0" value={form.totalFee} onChange={(value) => update("totalFee", value)} />
              <Field label="Paid Amount" required type="number" min="0" value={form.paidAmount} onChange={(value) => update("paidAmount", value)} />

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Admission Status
                </label>
                <select
                  value={form.status}
                  onChange={(event) => update("status", event.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <Field label="Admission Date" required type="date" value={form.admissionDate} onChange={(value) => update("admissionDate", value)} />

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 px-6 py-4 border-t border-slate-200 bg-white/95 backdrop-blur flex justify-end gap-2">
            <button type="button" disabled={saving} onClick={onClose} className="h-9 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-sm">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function AdmissionMetric({
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

export default function Admissions() {
  const [admissions, setAdmissions] =
    useState([]);

  const [summary, setSummary] =
    useState({
      totalAdmissions: 0,
      thisMonth: 0,
      totalFees: 0,
      received: 0,
      pending: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    showAdmissionModal,
    setShowAdmissionModal,
  ] = useState(false);

  const [editingAdmission, setEditingAdmission] =
    useState(null);

  const [actionId, setActionId] =
    useState("");

  async function loadAdmissions() {
    setLoading(true);
    setError("");

    try {
      const data =
        await apiRequest(
          "/api/client/admissions"
        );

      setAdmissions(
        data.admissions || []
      );

      setSummary(
        data.summary || {
          totalAdmissions: 0,
          thisMonth: 0,
          totalFees: 0,
          received: 0,
          pending: 0,
        }
      );
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to load admissions"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmissions();
  }, []);

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return admissions;
      }

      return admissions.filter(
        (admission) =>
          admission.name
            ?.toLowerCase()
            .includes(query) ||
          admission.phone
            ?.toLowerCase()
            .includes(query) ||
          admission.college
            ?.toLowerCase()
            .includes(query) ||
          admission.course
            ?.toLowerCase()
            .includes(query) ||
          admission.counsellor
            ?.toLowerCase()
            .includes(query)
      );
    }, [
      admissions,
      search,
    ]);

  async function handleCreated() {
    setShowAdmissionModal(
      false
    );

    await loadAdmissions();
  }

  async function handleUpdated() {
    setEditingAdmission(null);
    await loadAdmissions();
  }

  async function deleteAdmission(admission) {
    const confirmed = window.confirm(
      `Delete admission for ${admission.name}?\n\nIf it is linked to a lead, the lead will be restored to its previous stage.`
    );

    if (!confirmed) {
      return;
    }

    setActionId(admission.id);
    setError("");

    try {
      await apiRequest(
        `/api/client/admissions/${admission.id}`,
        {
          method: "DELETE",
        }
      );

      await loadAdmissions();
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to delete admission"
      );
    } finally {
      setActionId("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Admissions / Student management
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Admissions
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage confirmed students, college placements, counsellors and payment progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowAdmissionModal(
              true
            )
          }
          className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={14} />
          New Admission
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdmissionMetric
          label="Total Admissions"
          value={summary.totalAdmissions}
          icon={UserCheck}
          detail="All confirmed admission records"
          tone="emerald"
        />

        <AdmissionMetric
          label="This Month"
          value={summary.thisMonth}
          icon={CalendarDays}
          detail="Admissions recorded this month"
          tone="indigo"
        />

        <AdmissionMetric
          label="Fees Collected"
          value={formatMoney(
            summary.received
          )}
          icon={CircleDollarSign}
          detail="Total amount received"
          tone="emerald"
        />

        <AdmissionMetric
          label="Pending Fees"
          value={formatMoney(
            summary.pending
          )}
          icon={WalletCards}
          detail="Outstanding student payments"
          tone="amber"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1 max-w-lg">
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
            placeholder="Search student, phone, college, course or counsellor..."
            className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
          />
        </div>

        <div className="sm:ml-auto flex items-center gap-2">
          <div className="hidden md:block text-xs text-slate-500 px-2">
            {filtered.length} of {admissions.length} records
          </div>

          <button
            type="button"
            onClick={loadAdmissions}
            disabled={loading}
            className="h-9 px-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center gap-2"
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
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 border border-rose-200 bg-rose-50 rounded-lg text-sm text-rose-700">
          <AlertCircle
            size={15}
          />

          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 flex items-center justify-center gap-2 text-sm text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <Loader2
            size={16}
            className="animate-spin"
          />

          Loading admissions...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <Table
          columns={[
            "Student",
            "College",
            "Course",
            "Paid",
            "Total Fee",
            "Pending",
            "Status",
            "Counsellor",
            "Date",
            "Actions",
          ]}
          empty="No admissions found"
          rows={filtered.map(
            (admission) => (
              <tr
                key={admission.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="px-4 py-2.5">
                  <div className="text-sm font-medium text-slate-900">
                    {admission.name}
                  </div>

                  <div className="text-xs text-slate-500">
                    {admission.phone ||
                      "—"}
                  </div>
                </td>

                <td className="px-4 py-3 text-sm text-slate-700">
                  {admission.college}
                </td>

                <td className="px-4 py-3 text-sm text-slate-600">
                  {admission.course}
                </td>

                <td className="px-4 py-3 text-sm text-emerald-700 font-semibold tabular-nums">
                  {formatMoney(
                    admission.paid
                  )}
                </td>

                <td className="px-4 py-3 text-sm text-slate-700">
                  {formatMoney(
                    admission.total
                  )}
                </td>

                <td className="px-4 py-3 text-sm text-amber-700 font-medium tabular-nums">
                  {formatMoney(
                    admission.pending
                  )}
                </td>

                <td className="px-4 py-2.5">
                  <Badge
                    tone={statusTone(
                      admission.status
                    )}
                  >
                    {admission.status}
                  </Badge>
                </td>

                <td className="px-4 py-3 text-sm text-slate-700">
                  {admission.counsellor}
                </td>

                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {formatDate(
                    admission.admissionDate
                  )}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Edit admission"
                      onClick={() =>
                        setEditingAdmission(admission)
                      }
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      type="button"
                      title="Delete admission"
                      disabled={actionId === admission.id}
                      onClick={() =>
                        deleteAdmission(admission)
                      }
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {actionId === admission.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            )
          )}
        />
        </div>
      )}

      {showAdmissionModal && (
        <AdmissionModal
          onClose={() =>
            setShowAdmissionModal(
              false
            )
          }
          onCreated={
            handleCreated
          }
        />
      )}

      {editingAdmission && (
        <EditAdmissionModal
          admission={editingAdmission}
          onClose={() =>
            setEditingAdmission(null)
          }
          onSaved={handleUpdated}
        />
      )}
    </div>
  );
}
