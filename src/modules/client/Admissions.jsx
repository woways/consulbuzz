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
  MoreHorizontal,
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

function CollegeModal({ editing, onClose, onSaved }) {
  const [name, setName] = useState(editing?.name || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest(
        editing ? `/api/client/admissions/partners/${editing.id}` : "/api/client/admissions/partners",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify({ name, description }),
        }
      );
      onSaved();
    } catch (error) {
      setError(error?.data?.message || "Unable to save college");
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
              This creates a dedicated admissions workspace card.
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center text-slate-500">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {error ? (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}

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
            <button type="button" onClick={onClose} className="h-9 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="h-9 px-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2">
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

function CollegeCard({ partner, onOpen, onEdit, onDelete }) {
  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-slate-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)] transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="w-11 h-11 rounded-xl bg-slate-950 text-white inline-flex items-center justify-center">
          <GraduationCap size={19} />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => onEdit(partner)} className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Edit college"><Pencil size={13} /></button>
          <button type="button" onClick={() => onDelete(partner)} className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="Delete college"><Trash2 size={13} /></button>
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

export default function Admissions() {
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [admissions, setAdmissions] = useState([]);
  const [summary, setSummary] = useState({ totalAdmissions: 0, thisMonth: 0, totalFees: 0, received: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [collegeModal, setCollegeModal] = useState(null);
  const [admissionModal, setAdmissionModal] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [success, setSuccess] = useState("");

  async function loadPartners() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/client/admissions/partners");
      setPartners(data.partners || []);
      if (selectedPartner) {
        const refreshed = (data.partners || []).find((item) => item.id === selectedPartner.id);
        if (refreshed) setSelectedPartner(refreshed);
      }
    } catch (error) {
      setError(error?.data?.message || "Unable to load admission colleges");
    } finally {
      setLoading(false);
    }
  }

  async function loadAdmissions(partnerId) {
    if (!partnerId) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(`/api/client/admissions?partnerId=${encodeURIComponent(partnerId)}`);
      setAdmissions(data.admissions || []);
      setSummary(data.summary || { totalAdmissions: 0, thisMonth: 0, totalFees: 0, received: 0, pending: 0 });
    } catch (error) {
      setError(error?.data?.message || "Unable to load admissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPartners(); }, []);
  useEffect(() => {
    if (selectedPartner?.id) loadAdmissions(selectedPartner.id);
  }, [selectedPartner?.id]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return admissions;
    return admissions.filter((admission) =>
      [admission.name, admission.phone, admission.course, admission.counsellor, admission.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [admissions, search]);

  async function deletePartner(partner) {
    if (!window.confirm(`Remove the ${partner.name} college card?`)) return;
    try {
      const data = await apiRequest(`/api/client/admissions/partners/${partner.id}`, { method: "DELETE" });
      setSuccess(data.message);
      await loadPartners();
    } catch (error) {
      setError(error?.data?.message || "Unable to remove college");
    }
  }

  async function deleteAdmission(admission) {
    if (!window.confirm(`Delete admission for ${admission.name}?`)) return;
    try {
      await apiRequest(`/api/client/admissions/${admission.id}`, { method: "DELETE" });
      setSuccess("Admission deleted");
      await Promise.all([loadAdmissions(selectedPartner.id), loadPartners()]);
    } catch (error) {
      setError(error?.data?.message || "Unable to delete admission");
    }
  }

  if (!selectedPartner) {
    return (
      <div className="space-y-5">
        <style>{`.premium-input{width:100%;height:40px;padding:0 12px;border:1px solid rgb(226 232 240);border-radius:10px;font-size:14px;background:white;color:rgb(15 23 42);outline:none}.premium-input:focus{border-color:rgb(148 163 184);box-shadow:0 0 0 3px rgb(241 245 249)}`}</style>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Admissions / College workspaces</div>
            <h1 className="mt-2 text-[26px] font-bold tracking-[-0.035em] text-slate-950">Admission Colleges</h1>
            <p className="mt-1 text-sm text-slate-500">Keep each college or partner separate, while Revenue and Analytics continue using the same admission records.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadPartners} disabled={loading} className="h-9 px-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-2"><RefreshCw size={13} className={loading ? "animate-spin" : ""} />Refresh</button>
            <button type="button" onClick={() => setCollegeModal({ mode: "create" })} className="h-9 px-3.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"><Plus size={14} />Add College</button>
          </div>
        </div>

        {success ? <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{success}</div> : null}
        {error ? <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div> : null}

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-20 flex items-center justify-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" />Loading admission colleges...</div>
        ) : partners.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center px-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center"><Building2 size={20} /></div>
            <div className="mt-4 text-base font-bold text-slate-900">Create your first admission college</div>
            <div className="mt-1 text-sm text-slate-500">Each card gets its own admissions, import flow and financial totals.</div>
            <button type="button" onClick={() => setCollegeModal({ mode: "create" })} className="mt-5 h-9 px-4 bg-slate-950 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"><Plus size={14} />Add College</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {partners.map((partner) => (
              <CollegeCard key={partner.id} partner={partner} onOpen={setSelectedPartner} onEdit={(item) => setCollegeModal({ mode: "edit", partner: item })} onDelete={deletePartner} />
            ))}
          </div>
        )}

        {collegeModal ? (
          <CollegeModal
            editing={collegeModal.mode === "edit" ? collegeModal.partner : null}
            onClose={() => setCollegeModal(null)}
            onSaved={async () => { setCollegeModal(null); setSuccess("College saved successfully"); await loadPartners(); }}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <style>{`.premium-input{width:100%;height:40px;padding:0 12px;border:1px solid rgb(226 232 240);border-radius:10px;font-size:14px;background:white;color:rgb(15 23 42);outline:none}.premium-input:focus{border-color:rgb(148 163 184);box-shadow:0 0 0 3px rgb(241 245 249)}`}</style>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button type="button" onClick={() => { setSelectedPartner(null); setAdmissions([]); setSearch(""); }} className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5"><ArrowLeft size={13} />All colleges</button>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center"><GraduationCap size={18} /></div>
            <div>
              <h1 className="text-[25px] font-bold tracking-[-0.035em] text-slate-950">{selectedPartner.name}</h1>
              <p className="text-sm text-slate-500">Dedicated admissions workspace</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowImport(true)} className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-2"><Upload size={13} />Import Admissions</button>
          <button type="button" onClick={() => setAdmissionModal({ mode: "create" })} className="h-9 px-3.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"><Plus size={14} />New Admission</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric label="Admissions" value={summary.totalAdmissions} icon={UserCheck} detail="Records in this college" tone="indigo" />
        <Metric label="This Month" value={summary.thisMonth} icon={CalendarDays} detail="Admissions this month" tone="slate" />
        <Metric label="Received" value={money(summary.received)} icon={CircleDollarSign} detail="Fees received" tone="emerald" />
        <Metric label="Pending" value={money(summary.pending)} icon={WalletCards} detail="Outstanding fees" tone="amber" />
      </div>

      {success ? <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{success}</div> : null}
      {error ? <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div> : null}

      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1 max-w-lg">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, phone, course or counsellor..." className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400" />
        </div>
        <button type="button" onClick={() => loadAdmissions(selectedPartner.id)} disabled={loading} className="sm:ml-auto h-9 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-2 hover:bg-slate-50"><RefreshCw size={13} className={loading ? "animate-spin" : ""} />Refresh</button>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 flex items-center justify-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" />Loading admissions...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <Table
            columns={["Student", "Course", "Paid", "Total Fee", "Pending", "Status", "Counsellor", "Date", "Actions"]}
            empty="No admissions in this college"
            rows={filtered.map((admission) => (
              <tr key={admission.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3"><div className="text-sm font-semibold text-slate-900">{admission.name}</div><div className="text-xs text-slate-500 mt-0.5">{admission.phone || "—"}</div></td>
                <td className="px-4 py-3 text-sm text-slate-600">{admission.course}</td>
                <td className="px-4 py-3 text-sm text-emerald-700 font-semibold tabular-nums">{money(admission.paid)}</td>
                <td className="px-4 py-3 text-sm text-slate-700 tabular-nums">{money(admission.total)}</td>
                <td className="px-4 py-3 text-sm text-amber-700 font-semibold tabular-nums">{money(admission.pending)}</td>
                <td className="px-4 py-3"><Badge tone={statusTone(admission.status)}>{admission.status}</Badge></td>
                <td className="px-4 py-3 text-sm text-slate-700">{admission.counsellor}</td>
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(admission.admissionDate)}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-1"><button type="button" onClick={() => setAdmissionModal({ mode: "edit", admission })} className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><Pencil size={13} /></button><button type="button" onClick={() => deleteAdmission(admission)} className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 size={13} /></button></div></td>
              </tr>
            ))}
          />
        </div>
      )}

      {admissionModal ? (
        <AdmissionModal
          partner={selectedPartner}
          admission={admissionModal.mode === "edit" ? admissionModal.admission : null}
          onClose={() => setAdmissionModal(null)}
          onSaved={async () => { setAdmissionModal(null); setSuccess("Admission saved successfully"); await Promise.all([loadAdmissions(selectedPartner.id), loadPartners()]); }}
        />
      ) : null}

      {showImport ? (
        <ImportModal
          partner={selectedPartner}
          onClose={() => setShowImport(false)}
          onImported={async (data) => {
            setShowImport(false);
            setSuccess(`${data.importSummary.imported} imported · ${data.importSummary.duplicates} duplicates · ${data.importSummary.invalid} invalid skipped`);
            await Promise.all([loadAdmissions(selectedPartner.id), loadPartners()]);
          }}
        />
      ) : null}
    </div>
  );
}
