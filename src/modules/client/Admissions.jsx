import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  UserCheck,
  CalendarDays,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  Search,
  WalletCards,
  CircleDollarSign,
  Pencil,
  Trash2,
  Building2,
  ArrowLeft,
  Upload,
  ChevronRight,
  GraduationCap,
  Download,
  ArrowUpDown,
} from "lucide-react";

import {
  Table,
  Badge,
  statusTone,
} from "../../components/ui";

import { apiRequest } from "../../lib/api";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STREAM_COLORS = [
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "rose", label: "Rose" },
  { value: "amber", label: "Amber" },
  { value: "emerald", label: "Emerald" },
  { value: "cyan", label: "Cyan" },
  { value: "slate", label: "Slate" },
];

const STREAM_TONES = {
  blue: {
    card: "bg-blue-50/70 border-blue-200",
    icon: "bg-blue-100 text-blue-700 border-blue-200",
    text: "text-blue-700",
    college: "border-blue-200 hover:border-blue-400 hover:shadow-blue-100/70",
  },
  purple: {
    card: "bg-purple-50/70 border-purple-200",
    icon: "bg-purple-100 text-purple-700 border-purple-200",
    text: "text-purple-700",
    college: "border-purple-200 hover:border-purple-400 hover:shadow-purple-100/70",
  },
  rose: {
    card: "bg-rose-50/70 border-rose-200",
    icon: "bg-rose-100 text-rose-700 border-rose-200",
    text: "text-rose-700",
    college: "border-rose-200 hover:border-rose-400 hover:shadow-rose-100/70",
  },
  amber: {
    card: "bg-amber-50/70 border-amber-200",
    icon: "bg-amber-100 text-amber-700 border-amber-200",
    text: "text-amber-700",
    college: "border-amber-200 hover:border-amber-400 hover:shadow-amber-100/70",
  },
  emerald: {
    card: "bg-emerald-50/70 border-emerald-200",
    icon: "bg-emerald-100 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
    college: "border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100/70",
  },
  cyan: {
    card: "bg-cyan-50/70 border-cyan-200",
    icon: "bg-cyan-100 text-cyan-700 border-cyan-200",
    text: "text-cyan-700",
    college: "border-cyan-200 hover:border-cyan-400 hover:shadow-cyan-100/70",
  },
  slate: {
    card: "bg-slate-50 border-slate-200",
    icon: "bg-slate-100 text-slate-700 border-slate-200",
    text: "text-slate-700",
    college: "border-slate-200 hover:border-slate-400 hover:shadow-slate-100/70",
  },
};

function streamTone(color) {
  return STREAM_TONES[color] || STREAM_TONES.blue;
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function Field({ label, required, children, full = false }) {
  return (
    <label className={full ? "md:col-span-2" : ""}>
      <div className="text-xs font-semibold text-slate-600 mb-1.5">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </div>
      {children}
    </label>
  );
}

function Metric({ label, value, detail, icon: Icon, tone = "indigo" }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-[23px] leading-none font-bold tracking-[-0.03em] text-slate-950">
            {value}
          </div>
        </div>
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${tones[tone] || tones.indigo}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        {detail}
      </div>
    </div>
  );
}

function StreamModal({ editing, onClose, onSaved }) {
  const [name, setName] = useState(editing?.name || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [color, setColor] = useState(editing?.color || "blue");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiRequest(
        editing
          ? `/api/client/admissions/streams/${editing.id}`
          : "/api/client/admissions/streams",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify({
            name,
            description,
            color,
          }),
        }
      );

      onSaved();
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to save stream"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-slate-950">
              {editing ? "Edit Stream" : "Add Admission Stream"}
            </div>

            <div className="text-xs text-slate-500 mt-1">
              Create a stream first, then add colleges inside it.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center text-slate-500"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {error ? (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}

          <Field label="Stream Name" required>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Engineering / Medical / Management..."
              className="premium-input"
            />
          </Field>

          <Field label="Card Color">
            <div className="grid grid-cols-7 gap-2">
              {STREAM_COLORS.map((item) => {
                const tone = streamTone(item.value);
                const selected = color === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setColor(item.value)}
                    title={item.label}
                    className={`h-9 rounded-lg border transition-all ${tone.icon} ${
                      selected
                        ? "ring-2 ring-offset-2 ring-slate-900/20"
                        : "opacity-75 hover:opacity-100"
                    }`}
                    aria-label={`Use ${item.label} stream color`}
                  />
                );
              })}
            </div>
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional internal note"
              className="premium-input min-h-[88px] py-2.5"
            />
          </Field>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-9 px-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              {editing ? "Save Changes" : "Add Stream"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CollegeModal({
  stream,
  streams,
  editing,
  onClose,
  onSaved,
}) {
  const [streamId, setStreamId] = useState(
    editing?.streamId || stream?.id || ""
  );
  const [name, setName] = useState(editing?.name || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();

    if (!streamId) {
      setError("Select a stream");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await apiRequest(
        editing
          ? `/api/client/admissions/partners/${editing.id}`
          : "/api/client/admissions/partners",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify({
            streamId,
            name,
            description,
          }),
        }
      );

      onSaved();
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to save college"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-slate-950">
              {editing ? "Edit College" : "Add Admission College"}
            </div>

            <div className="text-xs text-slate-500 mt-1">
              Every college belongs to one admission stream.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center text-slate-500"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {error ? (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}

          <Field label="Stream" required>
            <select
              required
              value={streamId}
              onChange={(event) => setStreamId(event.target.value)}
              className="premium-input"
            >
              <option value="">Select stream</option>
              {streams.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="College / Partner Name" required>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="NIAT / Intellipaat / Sunstone..."
              className="premium-input"
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional internal note"
              className="premium-input min-h-[88px] py-2.5"
            />
          </Field>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-9 px-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              {editing ? "Save Changes" : "Add College"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdmissionModal({ partner, admission, onClose, onSaved }) {
  const editing = Boolean(admission);
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(!editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    leadId: admission?.leadId || "",
    studentName: admission?.name || "",
    studentPhone: admission?.phone || "",
    studentEmail: admission?.email || "",
    course: admission?.course || "",
    counsellorName: admission?.counsellorName || (admission?.counsellor === "Unassigned" ? "" : admission?.counsellor) || "",
    totalFee: admission?.total ?? "",
    paidAmount: admission?.paid ?? "",
    status: admission?.statusKey || "ONGOING",
    admissionDate: dateInput(admission?.admissionDate) || new Date().toISOString().slice(0, 10),
    notes: admission?.notes || "",
  });

  useEffect(() => {
    if (editing) return;
    let active = true;
    async function load() {
      try {
        const data = await apiRequest("/api/client/admissions/eligible-leads");
        if (active) setLeads(data.leads || []);
      } catch (error) {
        if (active) setError(error?.data?.message || "Unable to load leads");
      } finally {
        if (active) setLoadingLeads(false);
      }
    }
    load();
    return () => { active = false; };
  }, [editing]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectLead(leadId) {
    const selected = leads.find((lead) => lead.id === leadId);
    if (!selected) {
      update("leadId", "");
      return;
    }
    setForm((current) => ({
      ...current,
      leadId: selected.id,
      studentName: selected.name || "",
      studentPhone: selected.phone || "",
      studentEmail: selected.email || "",
      course: selected.course || "",
      counsellorName: selected.assignedToName || "",
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest(
        editing ? `/api/client/admissions/${admission.id}` : "/api/client/admissions",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify({
            ...form,
            partnerId: partner.id,
            totalFee: Number(form.totalFee || 0),
            paidAmount: Number(form.paidAmount || 0),
          }),
        }
      );
      onSaved();
    } catch (error) {
      setError(error?.data?.message || "Unable to save admission");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[92vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-600">
              {partner.name}
            </div>
            <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-slate-950">
              {editing ? "Edit Admission" : "New Admission"}
            </h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="w-8 h-8 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center text-slate-500">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="overflow-y-auto max-h-[calc(92vh-82px)]">
          <div className="p-6 space-y-5">
            {error ? (
              <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                <AlertCircle size={14} className="mt-0.5" />
                {error}
              </div>
            ) : null}

            {!editing ? (
              <Field label="Existing CRM Lead" full>
                <select
                  value={form.leadId}
                  disabled={loadingLeads}
                  onChange={(event) => selectLead(event.target.value)}
                  className="premium-input"
                >
                  <option value="">Direct admission / no linked lead</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} · {lead.phone}{lead.course ? ` · ${lead.course}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Student Name" required>
                <input required value={form.studentName} onChange={(e) => update("studentName", e.target.value)} className="premium-input" />
              </Field>
              <Field label="Phone">
                <input value={form.studentPhone} onChange={(e) => update("studentPhone", e.target.value)} className="premium-input" />
              </Field>
              <Field label="Email">
                <input type="email" value={form.studentEmail} onChange={(e) => update("studentEmail", e.target.value)} className="premium-input" />
              </Field>
              <Field label="Course" required>
                <input required value={form.course} onChange={(e) => update("course", e.target.value)} className="premium-input" />
              </Field>
              <Field label="Counsellor">
                <input value={form.counsellorName} onChange={(e) => update("counsellorName", e.target.value)} className="premium-input" />
              </Field>
              <Field label="Admission Date" required>
                <input type="date" required value={form.admissionDate} onChange={(e) => update("admissionDate", e.target.value)} className="premium-input" />
              </Field>
              <Field label="Total Fee" required>
                <input type="number" min="0" required value={form.totalFee} onChange={(e) => update("totalFee", e.target.value)} className="premium-input" />
              </Field>
              <Field label="Paid Amount" required>
                <input type="number" min="0" required value={form.paidAmount} onChange={(e) => update("paidAmount", e.target.value)} className="premium-input" />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => update("status", e.target.value)} className="premium-input">
                  {STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </Field>
              <Field label="Notes" full>
                <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} className="premium-input min-h-[88px] py-2.5" />
              </Field>
            </div>
          </div>

          <div className="sticky bottom-0 px-6 py-4 border-t border-slate-200 bg-white/95 backdrop-blur flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={saving} className="h-9 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="h-9 px-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2">
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              {editing ? "Save Changes" : "Create Admission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportModal({ partner, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!file) {
      setError("Choose a CSV or XLSX file");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const data = await apiRequest(`/api/client/admissions/partners/${partner.id}/import`, {
        method: "POST",
        body,
      });
      onImported(data);
    } catch (error) {
      setError(error?.data?.message || "Unable to import admissions");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-600">{partner.name}</div>
            <div className="mt-1 text-base font-bold text-slate-950">Import Admissions</div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center text-slate-500">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {error ? <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div> : null}

          <label className="min-h-[150px] border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl flex items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-colors px-6">
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
            <div className="text-center">
              <Upload size={24} className="mx-auto text-indigo-500" />
              <div className="mt-2 text-sm font-bold text-slate-800">
                {file ? file.name : "Choose CSV or XLSX"}
              </div>
              <div className="mt-1 text-xs text-slate-500">Maximum 5 MB · up to 2,000 admissions</div>
            </div>
          </label>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs leading-5 text-slate-600">
            Required columns: <strong>Name</strong>, <strong>Course</strong>. Optional: Phone, Email, Counsellor, Total Fee, Paid Amount, Status, Admission Date, Notes.
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-9 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">Cancel</button>
            <button type="submit" disabled={saving || !file} className="h-9 px-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {saving ? "Importing..." : "Import"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StreamCard({
  stream,
  onOpen,
  onViewAdmissions,
  onEdit,
  onDelete,
}) {
  const tone = streamTone(stream.color);

  return (
    <div className={`group border rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)] transition-all ${tone.card}`}>
      <div className="flex items-start justify-between gap-4">
        <div className={`w-11 h-11 rounded-xl border inline-flex items-center justify-center ${tone.icon}`}>
          <GraduationCap size={19} />
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(stream)}
            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            title="Edit stream"
          >
            <Pencil size={13} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(stream)}
            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            title="Delete stream"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-base font-bold tracking-[-0.02em] text-slate-950">
          {stream.name}
        </div>

        <div className="mt-1 text-xs text-slate-500 line-clamp-1">
          {stream.description || "Admission stream"}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] font-bold text-slate-400">
            Colleges
          </div>
          <div className="mt-1 text-lg font-bold text-slate-950">
            {stream.totalColleges}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] font-bold text-slate-400">
            Admissions
          </div>
          <div className="mt-1 text-lg font-bold text-slate-950">
            {stream.totalAdmissions}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] font-bold text-slate-400">
            Received
          </div>
          <div className={`mt-1 text-sm font-bold truncate ${tone.text}`}>
            {money(stream.received)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onOpen(stream)}
          className="h-9 rounded-xl bg-white/70 hover:bg-white border border-slate-200 text-xs font-bold text-slate-700 inline-flex items-center justify-center gap-1.5 px-3 transition-colors"
        >
          Open colleges
          <ChevronRight size={14} />
        </button>

        <button
          type="button"
          onClick={() => onViewAdmissions(stream)}
          className={`h-9 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 px-3 transition-colors ${tone.icon}`}
        >
          <UserCheck size={13} />
          View admissions
        </button>
      </div>
    </div>
  );
}

function CollegeCard({ partner, streamColor, onOpen, onEdit, onDelete }) {
  const tone = streamTone(streamColor || partner.stream?.color);

  return (
    <div className={`group bg-white border-2 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)] transition-all ${tone.college}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="w-11 h-11 rounded-xl bg-slate-950 text-white inline-flex items-center justify-center">
          <GraduationCap size={19} />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(partner)}
            className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-indigo-700 hover:bg-indigo-50"
            title="Edit or move college"
          >
            <Pencil size={12} />
            Edit / Move
          </button>

          <button
            type="button"
            onClick={() => onDelete(partner)}
            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            title="Delete college"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-base font-bold tracking-[-0.02em] text-slate-950">{partner.name}</div>
        <div className="mt-1 text-xs text-slate-500 line-clamp-1">{partner.description || "Admission workspace"}</div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] font-bold text-slate-400">Admissions</div>
          <div className="mt-1 text-lg font-bold text-slate-950">{partner.totalAdmissions}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] font-bold text-slate-400">Received</div>
          <div className="mt-1 text-sm font-bold text-emerald-700 truncate">{money(partner.received)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] font-bold text-slate-400">Pending</div>
          <div className="mt-1 text-sm font-bold text-amber-700 truncate">{money(partner.pending)}</div>
        </div>
      </div>

      <button type="button" onClick={() => onOpen(partner)} className="mt-5 w-full h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 inline-flex items-center justify-between px-3 transition-colors">
        Open admissions
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function Breadcrumbs({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2 w-fit shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 ? <ChevronRight size={11} className="text-slate-300" /> : null}

          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              className="hover:text-indigo-700 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-slate-600">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Admissions({ selectedYear = "all" }) {
  const [streams, setStreams] = useState([]);
  const [partners, setPartners] = useState([]);
  const [selectedStream, setSelectedStream] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [admissions, setAdmissions] = useState([]);

  const [summary, setSummary] = useState({
    totalAdmissions: 0,
    thisMonth: 0,
    totalFees: 0,
    received: 0,
    pending: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [streamModal, setStreamModal] = useState(null);
  const [collegeModal, setCollegeModal] = useState(null);
  const [admissionModal, setAdmissionModal] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [success, setSuccess] = useState("");
  const [admissionsView, setAdmissionsView] = useState(null);
  const [sortBy, setSortBy] = useState("date-desc");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegeSort, setCollegeSort] = useState("name-asc");

  async function loadStreams() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(
        `/api/client/admissions/streams?year=${encodeURIComponent(selectedYear)}`
      );

      setStreams(data.streams || []);

      if (selectedStream) {
        const refreshed = (data.streams || []).find(
          (item) => item.id === selectedStream.id
        );

        if (refreshed) {
          setSelectedStream(refreshed);
        }
      }
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to load admission streams"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPartners(streamId = selectedStream?.id) {
    if (!streamId) return;

    setLoading(true);
    setError("");

    try {
      const [partnerData, admissionData] = await Promise.all([
        apiRequest(
          `/api/client/admissions/partners?streamId=${encodeURIComponent(
            streamId
          )}&year=${encodeURIComponent(selectedYear)}`
        ),
        apiRequest(
          `/api/client/admissions?streamId=${encodeURIComponent(
            streamId
          )}&year=${encodeURIComponent(selectedYear)}`
        ),
      ]);

      setPartners(partnerData.partners || []);

      if (!selectedPartner && !admissionsView) {
        setAdmissions(admissionData.admissions || []);
      }

      if (selectedPartner) {
        const refreshed = (partnerData.partners || []).find(
          (item) => item.id === selectedPartner.id
        );

        if (refreshed) {
          setSelectedPartner(refreshed);
        }
      }
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to load admission colleges"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadAdmissions(partnerId = null, streamId = null) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("year", selectedYear);

      if (partnerId) {
        params.set("partnerId", partnerId);
      } else if (streamId) {
        params.set("streamId", streamId);
      }

      const data = await apiRequest(
        `/api/client/admissions?${params.toString()}`
      );

      setAdmissions(data.admissions || []);

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
    loadStreams();
  }, [selectedYear]);

  useEffect(() => {
    if (selectedStream?.id) {
      loadPartners(selectedStream.id);
    }
  }, [selectedStream?.id, selectedYear]);

  useEffect(() => {
    if (selectedPartner?.id && !admissionsView) {
      loadAdmissions(selectedPartner.id);
    }
  }, [selectedPartner?.id, selectedYear, admissionsView]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const base = !query
      ? [...admissions]
      : admissions.filter((admission) =>
          [
            admission.name,
            admission.phone,
            admission.course,
            admission.counsellor,
            admission.status,
            admission.partner?.name,
            admission.partner?.stream?.name,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(query)
            )
        );

    return base.sort((a, b) => {
      if (sortBy === "name-asc") {
        return String(a.name || "").localeCompare(String(b.name || ""));
      }

      if (sortBy === "college-asc") {
        return String(a.partner?.name || a.college || "").localeCompare(
          String(b.partner?.name || b.college || "")
        );
      }

      if (sortBy === "received-desc") {
        return Number(b.paid || 0) - Number(a.paid || 0);
      }

      if (sortBy === "pending-desc") {
        return Number(b.pending || 0) - Number(a.pending || 0);
      }

      return new Date(b.admissionDate || 0) - new Date(a.admissionDate || 0);
    });
  }, [admissions, search, sortBy]);


  const filteredPartners = useMemo(() => {
    const query = collegeSearch.trim().toLowerCase();

    const base = !query
      ? [...partners]
      : partners.filter((partner) =>
          [
            partner.name,
            partner.description,
            partner.stream?.name,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(query)
            )
        );

    return base.sort((a, b) => {
      if (collegeSort === "admissions-desc") {
        return Number(b.totalAdmissions || 0) - Number(a.totalAdmissions || 0);
      }

      if (collegeSort === "received-desc") {
        return Number(b.received || 0) - Number(a.received || 0);
      }

      if (collegeSort === "pending-desc") {
        return Number(b.pending || 0) - Number(a.pending || 0);
      }

      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [partners, collegeSearch, collegeSort]);

  async function deleteStream(stream) {
    if (
      !window.confirm(
        `Remove the ${stream.name} stream?`
      )
    ) {
      return;
    }

    setError("");

    try {
      const data = await apiRequest(
        `/api/client/admissions/streams/${stream.id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(data.message);
      await loadStreams();
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to remove stream"
      );
    }
  }

  async function deletePartner(partner) {
    if (
      !window.confirm(
        `Remove the ${partner.name} college card?`
      )
    ) {
      return;
    }

    setError("");

    try {
      const data = await apiRequest(
        `/api/client/admissions/partners/${partner.id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(data.message);

      await Promise.all([
        loadPartners(selectedStream.id),
        loadStreams(),
      ]);
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to remove college"
      );
    }
  }

  async function deleteAdmission(admission) {
    if (
      !window.confirm(
        `Delete admission for ${admission.name}?`
      )
    ) {
      return;
    }

    try {
      await apiRequest(
        `/api/client/admissions/${admission.id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess("Admission deleted");

      if (admissionsView?.type === "all") {
        await Promise.all([
          loadAdmissions(null, null),
          loadStreams(),
        ]);
      } else if (admissionsView?.type === "stream") {
        await Promise.all([
          loadAdmissions(null, admissionsView.stream.id),
          loadPartners(admissionsView.stream.id),
          loadStreams(),
        ]);
      } else {
        await Promise.all([
          loadAdmissions(selectedPartner.id),
          loadPartners(selectedStream.id),
          loadStreams(),
        ]);
      }
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to delete admission"
      );
    }
  }

  const selectedStreamTone = selectedStream
    ? streamTone(selectedStream.color)
    : STREAM_TONES.blue;

  function exportAdmissionsCsv(rows, filename) {
    const headers = [
      "Student",
      "Phone",
      "Email",
      "Stream",
      "College",
      "Course",
      "Paid",
      "Total Fee",
      "Pending",
      "Status",
      "Counsellor",
      "Admission Date",
    ];

    const escape = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const lines = [
      headers.map(escape).join(","),
      ...rows.map((admission) =>
        [
          admission.name,
          admission.phone,
          admission.email,
          admission.partner?.stream?.name,
          admission.partner?.name || admission.college,
          admission.course,
          admission.paid,
          admission.total,
          admission.pending,
          admission.status,
          admission.counsellor,
          admission.admissionDate
            ? new Date(admission.admissionDate).toLocaleDateString("en-IN")
            : "",
        ]
          .map(escape)
          .join(",")
      ),
    ];

    const blob = new Blob([lines.join("\\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const overall = useMemo(() => {
    return streams.reduce(
      (acc, stream) => ({
        totalStreams: acc.totalStreams + 1,
        totalColleges: acc.totalColleges + Number(stream.totalColleges || 0),
        totalAdmissions: acc.totalAdmissions + Number(stream.totalAdmissions || 0),
        received: acc.received + Number(stream.received || 0),
        pending: acc.pending + Number(stream.pending || 0),
      }),
      {
        totalStreams: 0,
        totalColleges: 0,
        totalAdmissions: 0,
        received: 0,
        pending: 0,
      }
    );
  }, [streams]);

  const recentStreamAdmissions = useMemo(() => {
    if (!selectedStream) return [];

    return [...admissions]
      .filter(
        (item) =>
          item.partner?.stream?.id === selectedStream.id ||
          item.partner?.streamId === selectedStream.id
      )
      .sort(
        (a, b) =>
          new Date(b.admissionDate || 0) -
          new Date(a.admissionDate || 0)
      )
      .slice(0, 5);
  }, [admissions, selectedStream]);

  async function openAllAdmissions() {
    setSelectedStream(null);
    setSelectedPartner(null);
    setAdmissionsView({ type: "all" });
    setSearch("");
    setSuccess("");
    setError("");
    await loadAdmissions(null, null);
  }

  async function openStreamAdmissions(stream) {
    setSelectedStream(stream);
    setSelectedPartner(null);
    setAdmissionsView({
      type: "stream",
      stream,
    });
    setSearch("");
    setSuccess("");
    setError("");
    await loadAdmissions(null, stream.id);
  }

  function closeAdmissionsView() {
    const current = admissionsView;

    setAdmissionsView(null);
    setAdmissions([]);
    setSearch("");
    setSummary({
      totalAdmissions: 0,
      thisMonth: 0,
      totalFees: 0,
      received: 0,
      pending: 0,
    });

    if (current?.type === "all") {
      setSelectedStream(null);
      setSelectedPartner(null);
    } else if (current?.type === "stream") {
      setSelectedStream(current.stream);
      setSelectedPartner(null);
    }
  }

  const sharedStyle = (
    <style>{`.premium-input{width:100%;height:40px;padding:0 12px;border:1px solid rgb(226 232 240);border-radius:10px;font-size:14px;background:white;color:rgb(15 23 42);outline:none}.premium-input:focus{border-color:rgb(148 163 184);box-shadow:0 0 0 3px rgb(241 245 249)}`}</style>
  );

  /* =======================================================
     COMBINED ADMISSIONS VIEW
  ======================================================= */

  if (admissionsView) {
    const isAll = admissionsView.type === "all";
    const viewStream = admissionsView.stream || selectedStream;

    return (
      <div className="space-y-5">
        {sharedStyle}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Breadcrumbs
              items={
                isAll
                  ? [
                      {
                        label: "Admissions",
                        onClick: closeAdmissionsView,
                      },
                      { label: "All Admissions" },
                    ]
                  : [
                      {
                        label: "Admissions",
                        onClick: () => {
                          setAdmissionsView(null);
                          setSelectedStream(null);
                          setAdmissions([]);
                        },
                      },
                      {
                        label: viewStream?.name || "Stream",
                        onClick: closeAdmissionsView,
                      },
                      { label: "Admissions" },
                    ]
              }
            />

            <button
              type="button"
              onClick={closeAdmissionsView}
              className="mt-3 text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={13} />
              {isAll ? "Admissions overview" : `${viewStream?.name || "Stream"} colleges`}
            </button>

            <div className="mt-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {isAll ? "Admissions / All Streams" : `Admissions / ${viewStream?.name}`}
              </div>

              <h1 className="mt-2 text-[26px] font-bold tracking-[-0.035em] text-slate-950">
                {isAll ? "All Admissions" : `${viewStream?.name} Admissions`}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {isAll
                  ? "View admissions across every stream and college in one place."
                  : `View all admissions across every college inside ${viewStream?.name}.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              isAll
                ? loadAdmissions(null, null)
                : loadAdmissions(null, viewStream?.id)
            }
            disabled={loading}
            className="h-9 px-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-2"
          >
            <RefreshCw
              size={13}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <Metric
            label="Admissions"
            value={summary.totalAdmissions}
            icon={UserCheck}
            detail={isAll ? "Across all streams" : "Across this stream"}
            tone="indigo"
          />

          <Metric
            label="This Month"
            value={summary.thisMonth}
            icon={CalendarDays}
            detail="Admissions this month"
            tone="slate"
          />

          <Metric
            label="Total Fees"
            value={money(summary.totalFees)}
            icon={WalletCards}
            detail="Admission fee value"
            tone="slate"
          />

          <Metric
            label="Received"
            value={money(summary.received)}
            icon={CircleDollarSign}
            detail="Fees received"
            tone="emerald"
          />

          <Metric
            label="Pending"
            value={money(summary.pending)}
            icon={WalletCards}
            detail="Outstanding fees"
            tone="amber"
          />
        </div>

        {error ? (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {error}
          </div>
        ) : null}

        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col lg:flex-row lg:items-center gap-2">
          <div className="relative flex-1 max-w-lg">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student, stream, college, course or counsellor..."
              className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400"
            />
          </div>

          <div className="lg:ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
              <ArrowUpDown
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="h-9 pl-8 pr-8 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="date-desc">Latest first</option>
                <option value="name-asc">Student A-Z</option>
                <option value="college-asc">College A-Z</option>
                <option value="received-desc">Highest received</option>
                <option value="pending-desc">Highest pending</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() =>
                exportAdmissionsCsv(
                  filtered,
                  isAll
                    ? "all-admissions.csv"
                    : `${String(viewStream?.name || "stream")
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")}-admissions.csv`
                )
              }
              disabled={!filtered.length}
              className="h-9 px-3 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-2"
            >
              <Download size={13} />
              Export
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Loading admissions...
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <Table
              columns={[
                "Student",
                "Stream",
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
              rows={filtered.map((admission) => (
                <tr
                  key={admission.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-slate-900">
                      {admission.name}
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5">
                      {admission.phone || "—"}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-700">
                    {admission.partner?.stream?.name || "—"}
                  </td>

                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                    {admission.partner?.name || admission.college || "—"}
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-600">
                    {admission.course}
                  </td>

                  <td className="px-4 py-3 text-sm text-emerald-700 font-semibold tabular-nums">
                    {money(admission.paid)}
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-700 tabular-nums">
                    {money(admission.total)}
                  </td>

                  <td className="px-4 py-3 text-sm text-amber-700 font-semibold tabular-nums">
                    {money(admission.pending)}
                  </td>

                  <td className="px-4 py-3">
                    <Badge tone={statusTone(admission.status)}>
                      {admission.status}
                    </Badge>
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-700">
                    {admission.counsellor}
                  </td>

                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(admission.admissionDate)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const stream = streams.find(
                            (item) => item.id === admission.partner?.stream?.id
                          );

                          if (stream) {
                            setSelectedStream(stream);
                          }

                          if (admission.partner) {
                            setSelectedPartner({
                              ...admission.partner,
                              streamId: admission.partner?.stream?.id,
                            });
                          }

                          setAdmissionsView(null);

                          setAdmissionModal({
                            mode: "edit",
                            admission,
                          });
                        }}
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        title="Edit admission"
                      >
                        <Pencil size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteAdmission(admission)}
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete admission"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            />
          </div>
        )}

        {admissionModal && selectedPartner ? (
          <AdmissionModal
            partner={selectedPartner}
            admission={
              admissionModal.mode === "edit"
                ? admissionModal.admission
                : null
            }
            onClose={() => setAdmissionModal(null)}
            onSaved={async () => {
              const previousView = admissionsView;

              setAdmissionModal(null);
              setSuccess("Admission saved successfully");

              if (previousView?.type === "all") {
                await Promise.all([
                  loadAdmissions(null, null),
                  loadStreams(),
                ]);
              } else if (previousView?.type === "stream") {
                await Promise.all([
                  loadAdmissions(null, previousView.stream.id),
                  loadPartners(previousView.stream.id),
                  loadStreams(),
                ]);
              }
            }}
          />
        ) : null}
      </div>
    );
  }

  /* =======================================================
     LEVEL 1 — STREAMS
  ======================================================= */

  if (!selectedStream) {
    return (
      <div className="space-y-5">
        {sharedStyle}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Breadcrumbs
              items={[
                { label: "Admissions" },
              ]}
            />

            <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Admissions / Streams
            </div>

            <h1 className="mt-2 text-[26px] font-bold tracking-[-0.035em] text-slate-950">
              Admission Streams
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              First create a stream, then keep its colleges and admissions separate.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={openAllAdmissions}
              className="h-9 px-3.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold inline-flex items-center gap-2"
            >
              <UserCheck size={14} />
              All Admissions
            </button>

            <button
              type="button"
              onClick={loadStreams}
              disabled={loading}
              className="h-9 px-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-2"
            >
              <RefreshCw
                size={13}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                setStreamModal({ mode: "create" })
              }
              className="h-9 px-3.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
            >
              <Plus size={14} />
              Add Stream
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <Metric
            label="Total Streams"
            value={overall.totalStreams}
            icon={GraduationCap}
            detail="Admission streams"
            tone="indigo"
          />

          <Metric
            label="Total Colleges"
            value={overall.totalColleges}
            icon={Building2}
            detail="Across all streams"
            tone="slate"
          />

          <Metric
            label="Overall Admissions"
            value={overall.totalAdmissions}
            icon={UserCheck}
            detail="Across every college"
            tone="indigo"
          />

          <Metric
            label="Received"
            value={money(overall.received)}
            icon={CircleDollarSign}
            detail="Across all admissions"
            tone="emerald"
          />

          <Metric
            label="Pending"
            value={money(overall.pending)}
            icon={WalletCards}
            detail="Across all admissions"
            tone="amber"
          />
        </div>

        {success ? (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            {success}
          </div>
        ) : null}

        {error ? (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-20 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Loading admission streams...
          </div>
        ) : streams.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center px-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap size={20} />
            </div>

            <div className="mt-4 text-base font-bold text-slate-900">
              Create your first admission stream
            </div>

            <div className="mt-1 text-sm text-slate-500">
              Example: Engineering, Medical, Management or Degree.
            </div>

            <button
              type="button"
              onClick={() =>
                setStreamModal({ mode: "create" })
              }
              className="mt-5 h-9 px-4 bg-slate-950 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
            >
              <Plus size={14} />
              Add Stream
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {streams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                onOpen={(item) => {
                  setSelectedStream(item);
                  setPartners([]);
                  setSuccess("");
                  setError("");
                }}
                onViewAdmissions={openStreamAdmissions}
                onEdit={(item) =>
                  setStreamModal({
                    mode: "edit",
                    stream: item,
                  })
                }
                onDelete={deleteStream}
              />
            ))}
          </div>
        )}

        {streamModal ? (
          <StreamModal
            editing={
              streamModal.mode === "edit"
                ? streamModal.stream
                : null
            }
            onClose={() => setStreamModal(null)}
            onSaved={async () => {
              setStreamModal(null);
              setSuccess("Stream saved successfully");
              await loadStreams();
            }}
          />
        ) : null}
      </div>
    );
  }

  /* =======================================================
     LEVEL 2 — COLLEGES
  ======================================================= */

  if (!selectedPartner) {
    return (
      <div className="space-y-5">
        {sharedStyle}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Breadcrumbs
              items={[
                {
                  label: "Admissions",
                  onClick: () => {
                    setSelectedStream(null);
                    setSelectedPartner(null);
                    setAdmissionsView(null);
                    setPartners([]);
                    setAdmissions([]);
                  },
                },
                { label: selectedStream.name },
              ]}
            />

            <button
              type="button"
              onClick={() => {
                setSelectedStream(null);
                setPartners([]);
                setSearch("");
                setSuccess("");
                setError("");
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={13} />
              All streams
            </button>

            <div className="mt-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${selectedStreamTone.icon}`}>
                <GraduationCap size={18} />
              </div>

              <div>
                <div className={`text-[10px] font-bold uppercase tracking-[0.12em] ${selectedStreamTone.text}`}>
                  {selectedStream.name}
                </div>

                <h1 className="mt-1 text-[25px] font-bold tracking-[-0.035em] text-slate-950">
                  Colleges
                </h1>

                <p className="text-sm text-slate-500">
                  Colleges and admission partners under this stream.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => openStreamAdmissions(selectedStream)}
              className={`h-9 px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 ${selectedStreamTone.icon}`}
            >
              <UserCheck size={14} />
              View Stream Admissions
            </button>

            <button
              type="button"
              onClick={() =>
                loadPartners(selectedStream.id)
              }
              disabled={loading}
              className="h-9 px-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-2"
            >
              <RefreshCw
                size={13}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                setCollegeModal({ mode: "create" })
              }
              className="h-9 px-3.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
            >
              <Plus size={14} />
              Add College
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Metric
            label="Total Colleges"
            value={selectedStream?.totalColleges || 0}
            icon={Building2}
            detail={`Colleges in ${selectedStream.name}`}
            tone="slate"
          />

          <Metric
            label="Total Admissions"
            value={selectedStream?.totalAdmissions || 0}
            icon={UserCheck}
            detail={`Across ${selectedStream.name}`}
            tone="indigo"
          />

          <Metric
            label="Received"
            value={money(selectedStream?.received)}
            icon={CircleDollarSign}
            detail="Across this stream"
            tone="emerald"
          />

          <Metric
            label="Pending"
            value={money(selectedStream?.pending)}
            icon={WalletCards}
            detail="Across this stream"
            tone="amber"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col lg:flex-row lg:items-center gap-2">
          <div className="relative flex-1 max-w-lg">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={collegeSearch}
              onChange={(event) => setCollegeSearch(event.target.value)}
              placeholder={`Search colleges in ${selectedStream.name}...`}
              className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400"
            />
          </div>

          <div className="lg:ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
              <ArrowUpDown
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={collegeSort}
                onChange={(event) => setCollegeSort(event.target.value)}
                className="h-9 pl-8 pr-8 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="name-asc">College A-Z</option>
                <option value="admissions-desc">Most admissions</option>
                <option value="received-desc">Highest received</option>
                <option value="pending-desc">Highest pending</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() =>
                exportAdmissionsCsv(
                  admissions.filter(
                    (item) =>
                      item.partner?.stream?.id === selectedStream.id ||
                      item.partner?.streamId === selectedStream.id
                  ),
                  `${String(selectedStream.name)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")}-admissions.csv`
                )
              }
              disabled={!admissions.length}
              className="h-9 px-3 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-2"
            >
              <Download size={13} />
              Export Stream Admissions
            </button>
          </div>
        </div>

        {success ? (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            {success}
          </div>
        ) : null}

        {error ? (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {error}
          </div>
        ) : null}

        {!loading && selectedStream ? (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Recent Admissions
                </div>

                <div className="mt-0.5 text-[11px] text-slate-500">
                  Latest admissions across colleges in {selectedStream.name}.
                </div>
              </div>

              <button
                type="button"
                onClick={() => openStreamAdmissions(selectedStream)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View all
              </button>
            </div>

            {recentStreamAdmissions.length ? (
              <div className="divide-y divide-slate-100">
                {recentStreamAdmissions.map((admission) => (
                  <div
                    key={admission.id}
                    className="px-4 py-3 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                      <UserCheck size={15} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {admission.name}
                      </div>

                      <div className="mt-0.5 text-[11px] text-slate-500 truncate">
                        {admission.partner?.name || admission.college || "College"} · {admission.course}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-slate-700">
                        {formatDate(admission.admissionDate)}
                      </div>

                      <div className="mt-0.5 text-[10px] text-emerald-700 font-semibold">
                        {money(admission.paid)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <div className="text-xs font-semibold text-slate-700">
                  No recent admissions in this stream
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  New admissions added to colleges in {selectedStream.name} will appear here.
                </div>
              </div>
            )}
          </div>
        ) : null}

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-20 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Loading colleges...
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center px-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <Building2 size={20} />
            </div>

            <div className="mt-4 text-base font-bold text-slate-900">
              {partners.length === 0
                ? `Add the first college to ${selectedStream.name}`
                : "No colleges match your search"}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              {partners.length === 0
                ? "Every college gets its own admissions, import flow and financial totals."
                : "Try a different college name or sort option."}
            </div>

            <button
              type="button"
              onClick={() =>
                setCollegeModal({ mode: "create" })
              }
              className="mt-5 h-9 px-4 bg-slate-950 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
            >
              <Plus size={14} />
              Add College
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPartners.map((partner) => (
              <CollegeCard
                key={partner.id}
                partner={partner}
                streamColor={selectedStream.color}
                onOpen={(item) => {
                  setSelectedPartner(item);
                  setAdmissions([]);
                  setSearch("");
                  setSuccess("");
                  setError("");
                }}
                onEdit={(item) =>
                  setCollegeModal({
                    mode: "edit",
                    partner: item,
                  })
                }
                onDelete={deletePartner}
              />
            ))}
          </div>
        )}

        {collegeModal ? (
          <CollegeModal
            stream={selectedStream}
            streams={streams}
            editing={
              collegeModal.mode === "edit"
                ? collegeModal.partner
                : null
            }
            onClose={() => setCollegeModal(null)}
            onSaved={async () => {
              setCollegeModal(null);
              setSuccess("College saved successfully");

              await Promise.all([
                loadPartners(selectedStream.id),
                loadStreams(),
              ]);
            }}
          />
        ) : null}
      </div>
    );
  }

  /* =======================================================
     LEVEL 3 — ADMISSIONS
  ======================================================= */

  return (
    <div className="space-y-5">
      {sharedStyle}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Breadcrumbs
            items={[
              {
                label: "Admissions",
                onClick: () => {
                  setSelectedStream(null);
                  setSelectedPartner(null);
                  setAdmissionsView(null);
                  setPartners([]);
                  setAdmissions([]);
                },
              },
              {
                label: selectedStream.name,
                onClick: () => {
                  setSelectedPartner(null);
                  setAdmissions([]);
                  setSearch("");
                },
              },
              { label: selectedPartner.name },
            ]}
          />

          <button
            type="button"
            onClick={() => {
              setSelectedPartner(null);
              setAdmissions([]);
              setSearch("");
              setSuccess("");
              setError("");
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={13} />
            {selectedStream.name} colleges
          </button>

          <div className="mt-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center">
              <GraduationCap size={18} />
            </div>

            <div>
              <div className={`text-[10px] font-bold uppercase tracking-[0.12em] ${selectedStreamTone.text}`}>
                {selectedStream.name}
              </div>

              <h1 className="text-[25px] font-bold tracking-[-0.035em] text-slate-950">
                {selectedPartner.name}
              </h1>

              <p className="text-sm text-slate-500">
                Dedicated admissions workspace
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-2"
          >
            <Upload size={13} />
            Import Admissions
          </button>

          <button
            type="button"
            onClick={() =>
              setAdmissionModal({ mode: "create" })
            }
            className="h-9 px-3.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
          >
            <Plus size={14} />
            New Admission
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric
          label="Admissions"
          value={summary.totalAdmissions}
          icon={UserCheck}
          detail="Records in this college"
          tone="indigo"
        />

        <Metric
          label="This Month"
          value={summary.thisMonth}
          icon={CalendarDays}
          detail="Admissions this month"
          tone="slate"
        />

        <Metric
          label="Received"
          value={money(summary.received)}
          icon={CircleDollarSign}
          detail="Fees received"
          tone="emerald"
        />

        <Metric
          label="Pending"
          value={money(summary.pending)}
          icon={WalletCards}
          detail="Outstanding fees"
          tone="amber"
        />
      </div>

      {success ? (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          {error}
        </div>
      ) : null}

      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col lg:flex-row lg:items-center gap-2">
        <div className="relative flex-1 max-w-lg">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder={`Search admissions in ${selectedPartner.name}...`}
            className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400"
          />
        </div>

        <div className="lg:ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <ArrowUpDown
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-9 pl-8 pr-8 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="date-desc">Latest first</option>
              <option value="name-asc">Student A-Z</option>
              <option value="received-desc">Highest received</option>
              <option value="pending-desc">Highest pending</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() =>
              exportAdmissionsCsv(
                filtered,
                `${String(selectedPartner.name)
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")}-admissions.csv`
              )
            }
            disabled={!filtered.length}
            className="h-9 px-3 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-2"
          >
            <Download size={13} />
            Export
          </button>

          <button
            type="button"
            onClick={() =>
              loadAdmissions(selectedPartner.id)
            }
            disabled={loading}
            className="h-9 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-2 hover:bg-slate-50"
          >
            <RefreshCw
              size={13}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Loading admissions...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <Table
            columns={[
              "Student",
              "Course",
              "Paid",
              "Total Fee",
              "Pending",
              "Status",
              "Counsellor",
              "Date",
              "Actions",
            ]}
            empty="No admissions in this college"
            rows={filtered.map((admission) => (
              <tr
                key={admission.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">
                    {admission.name}
                  </div>

                  <div className="text-xs text-slate-500 mt-0.5">
                    {admission.phone || "—"}
                  </div>
                </td>

                <td className="px-4 py-3 text-sm text-slate-600">
                  {admission.course}
                </td>

                <td className="px-4 py-3 text-sm text-emerald-700 font-semibold tabular-nums">
                  {money(admission.paid)}
                </td>

                <td className="px-4 py-3 text-sm text-slate-700 tabular-nums">
                  {money(admission.total)}
                </td>

                <td className="px-4 py-3 text-sm text-amber-700 font-semibold tabular-nums">
                  {money(admission.pending)}
                </td>

                <td className="px-4 py-3">
                  <Badge tone={statusTone(admission.status)}>
                    {admission.status}
                  </Badge>
                </td>

                <td className="px-4 py-3 text-sm text-slate-700">
                  {admission.counsellor}
                </td>

                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {formatDate(admission.admissionDate)}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setAdmissionModal({
                          mode: "edit",
                          admission,
                        })
                      }
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteAdmission(admission)
                      }
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          />
        </div>
      )}

      {admissionModal ? (
        <AdmissionModal
          partner={selectedPartner}
          admission={
            admissionModal.mode === "edit"
              ? admissionModal.admission
              : null
          }
          onClose={() =>
            setAdmissionModal(null)
          }
          onSaved={async () => {
            setAdmissionModal(null);
            setSuccess("Admission saved successfully");

            await Promise.all([
              loadAdmissions(selectedPartner.id),
              loadPartners(selectedStream.id),
              loadStreams(),
            ]);
          }}
        />
      ) : null}

      {showImport ? (
        <ImportModal
          partner={selectedPartner}
          onClose={() => setShowImport(false)}
          onImported={async (data) => {
            setShowImport(false);

            setSuccess(
              `${data.importSummary.imported} imported · ${data.importSummary.duplicates} duplicates · ${data.importSummary.invalid} invalid skipped`
            );

            await Promise.all([
              loadAdmissions(selectedPartner.id),
              loadPartners(selectedStream.id),
              loadStreams(),
            ]);
          }}
        />
      ) : null}
    </div>
  );
}
