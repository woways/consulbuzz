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
  Search,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  UserPlus,
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

  return date.toLocaleDateString(
    "en-IN",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
    }
  );
}

function Field({
  label,
  required = false,
  children,
  full = false,
}) {
  return (
    <label
      className={
        full
          ? "md:col-span-2"
          : ""
      }
    >
      <div className="block text-[13px] font-medium text-slate-600 mb-1">
        {label}

        {required && (
          <span className="text-rose-500 ml-0.5">
            *
          </span>
        )}
      </div>

      {children}
    </label>
  );
}


function IndividualLeadModal({
  assignees,
  onClose,
  onCreated,
}) {
  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    form,
    setForm,
  ] =
    useState({
      name: "",
      phone: "",
      email: "",
      course: "",
      type:
        "EXTERNAL_DATA",
      sourceName: "",
      assignedToUserId:
        "",
      notes: "",
    });

  function update(
    field,
    value
  ) {
    setForm(
      (current) => ({
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

    setSaving(true);
    setError("");

    try {
      const data =
        await apiRequest(
          "/api/client/lead-store/manual",
          {
            method:
              "POST",
            body:
              JSON.stringify(
                form
              ),
          }
        );

      onCreated(
        data
      );
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to add lead"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-white/70 w-full max-w-2xl max-h-[92vh] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-semibold">
              Add Individual Lead
            </h2>

            <p className="text-[13px] text-slate-500 mt-1">
              Add one lead directly to the CRM without creating a spreadsheet.
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
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
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
          <div className="p-6 grid md:grid-cols-2 gap-4">
            {error && (
              <div className="md:col-span-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-[15px] text-rose-700 flex items-start gap-2">
                <AlertCircle
                  size={15}
                  className="mt-0.5 flex-shrink-0"
                />
                {error}
              </div>
            )}

            <Field
              label="Name"
              required
            >
              <input
                required
                value={
                  form.name
                }
                onChange={(
                  event
                ) =>
                  update(
                    "name",
                    event.target.value
                  )
                }
                className="form-input"
                placeholder="Student / Lead name"
              />
            </Field>

            <Field
              label="Phone"
              required
            >
              <input
                required
                value={
                  form.phone
                }
                onChange={(
                  event
                ) =>
                  update(
                    "phone",
                    event.target.value
                  )
                }
                className="form-input"
                placeholder="9876543210"
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={
                  form.email
                }
                onChange={(
                  event
                ) =>
                  update(
                    "email",
                    event.target.value
                  )
                }
                className="form-input"
                placeholder="lead@example.com"
              />
            </Field>

            <Field label="Course / Interest">
              <input
                value={
                  form.course
                }
                onChange={(
                  event
                ) =>
                  update(
                    "course",
                    event.target.value
                  )
                }
                className="form-input"
                placeholder="B.Tech / MBA / NEET"
              />
            </Field>

            <Field
              label="Lead Type"
              required
            >
              <select
                value={
                  form.type
                }
                onChange={(
                  event
                ) =>
                  update(
                    "type",
                    event.target.value
                  )
                }
                className="form-input"
              >
                {TYPES.map(
                  (
                    type
                  ) => (
                    <option
                      key={
                        type.api
                      }
                      value={
                        type.api
                      }
                    >
                      {
                        type.label
                      }
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Source">
              <input
                value={
                  form.sourceName
                }
                onChange={(
                  event
                ) =>
                  update(
                    "sourceName",
                    event.target.value
                  )
                }
                className="form-input"
                placeholder="Justdial / Reference / College Expo"
              />
            </Field>

            <Field
              label="Assign To"
              full
            >
              <select
                value={
                  form.assignedToUserId
                }
                onChange={(
                  event
                ) =>
                  update(
                    "assignedToUserId",
                    event.target.value
                  )
                }
                className="form-input"
              >
                <option value="">
                  Unassigned
                </option>

                {assignees.map(
                  (
                    user
                  ) => (
                    <option
                      key={
                        user.id
                      }
                      value={
                        user.id
                      }
                    >
                      {user.name} · {user.role.replaceAll("_", " ")}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field
              label="Notes"
              full
            >
              <textarea
                rows={3}
                value={
                  form.notes
                }
                onChange={(
                  event
                ) =>
                  update(
                    "notes",
                    event.target.value
                  )
                }
                className="form-input min-h-[86px] py-2"
              />
            </Field>

            <div className="md:col-span-2 bg-indigo-50/60 border border-indigo-100 rounded-lg px-3 py-2.5 text-[13px] text-indigo-800 leading-5">
              This lead is stored directly in the main CRM Leads table. We do not create a fake one-row dataset. It will immediately appear in the normal Leads module.
            </div>
          </div>

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
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm"
            >
              {saving ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <UserPlus
                  size={14}
                />
              )}

              {saving
                ? "Adding..."
                : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UploadDatasetModal({
  assignees,
  onClose,
  onImported,
}) {
  const [
    file,
    setFile,
  ] =
    useState(null);

  const [
    preview,
    setPreview,
  ] =
    useState(null);

  const [
    previewing,
    setPreviewing,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    form,
    setForm,
  ] =
    useState({
      name: "",
      type:
        "EXTERNAL_DATA",
      sourceName:
        "",
      assignedToUserId:
        "",
      notes:
        "",
    });

  function update(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }

  async function previewFile(
    selectedFile
  ) {
    if (
      !selectedFile
    ) {
      setPreview(
        null
      );
      return;
    }

    setPreviewing(
      true
    );
    setError("");
    setPreview(null);

    try {
      const body =
        new FormData();

      body.append(
        "file",
        selectedFile
      );

      const data =
        await apiRequest(
          "/api/client/lead-store/preview",
          {
            method:
              "POST",
            body,
          }
        );

      setPreview(
        data
      );

      if (
        !form.name
      ) {
        update(
          "name",
          selectedFile.name.replace(
            /\.[^.]+$/,
            ""
          )
        );
      }
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to preview file"
      );
    } finally {
      setPreviewing(
        false
      );
    }
  }

  async function submit(
    event
  ) {
    event.preventDefault();

    if (!file) {
      setError(
        "Choose a CSV or XLSX file"
      );
      return;
    }

    if (
      !preview ||
      preview.summary
        ?.importableCount <
        1
    ) {
      setError(
        "This file has no importable leads"
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const body =
        new FormData();

      body.append(
        "file",
        file
      );

      body.append(
        "name",
        form.name
      );

      body.append(
        "type",
        form.type
      );

      body.append(
        "sourceName",
        form.sourceName
      );

      body.append(
        "assignedToUserId",
        form.assignedToUserId
      );

      body.append(
        "notes",
        form.notes
      );

      const data =
        await apiRequest(
          "/api/client/lead-store/import",
          {
            method:
              "POST",
            body,
          }
        );

      onImported(
        data
      );
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to import dataset"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-white/70 w-full max-w-3xl max-h-[92vh] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-semibold">
              Import Lead Dataset
            </h2>

            <p className="text-[13px] text-slate-500 mt-1">
              CSV/XLSX rows become real CRM leads. Name and Phone columns are required.
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
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
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
          className="overflow-y-auto max-h-[calc(92vh-80px)]"
        >
          <div className="p-6 space-y-5">
            {error && (
              <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-[15px] text-rose-700 flex items-start gap-2">
                <AlertCircle
                  size={15}
                  className="mt-0.5 flex-shrink-0"
                />
                {error}
              </div>
            )}

            <div>
              <div className="text-[13px] font-medium text-slate-600 mb-1">
                Lead File
                <span className="text-rose-500 ml-0.5">
                  *
                </span>
              </div>

              <label className="min-h-[112px] border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-xl flex items-center justify-center cursor-pointer transition-colors px-5">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(
                    event
                  ) => {
                    const selected =
                      event.target.files
                        ?.[0] ||
                      null;

                    setFile(
                      selected
                    );

                    previewFile(
                      selected
                    );
                  }}
                />

                <div className="text-center">
                  {previewing ? (
                    <Loader2
                      size={22}
                      className="mx-auto animate-spin text-indigo-600"
                    />
                  ) : (
                    <UploadCloud
                      size={24}
                      className="mx-auto text-indigo-500"
                    />
                  )}

                  <div className="mt-2 text-[15px] font-semibold text-slate-800">
                    {file
                      ? file.name
                      : "Choose CSV or XLSX"}
                  </div>

                  <div className="mt-1 text-[13px] text-slate-500">
                    Maximum 5 MB · Maximum 5,000 lead rows
                  </div>
                </div>
              </label>
            </div>

            {preview && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-bold text-slate-800">
                      Import Preview
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5">
                      Invalid and duplicate records will be skipped.
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <MiniPill
                      label="Rows"
                      value={
                        preview.summary
                          ?.totalRows ||
                        0
                      }
                    />

                    <MiniPill
                      label="Importable"
                      value={
                        preview.summary
                          ?.importableCount ||
                        0
                      }
                      tone="emerald"
                    />

                    <MiniPill
                      label="Duplicates"
                      value={
                        preview.summary
                          ?.duplicateCount ||
                        0
                      }
                      tone="amber"
                    />

                    <MiniPill
                      label="Invalid"
                      value={
                        preview.summary
                          ?.invalidCount ||
                        0
                      }
                      tone="rose"
                    />
                  </div>
                </div>

                {preview.sample?.length >
                  0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead className="bg-white text-slate-400">
                        <tr>
                          <th className="px-3 py-2 text-left">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left">
                            Phone
                          </th>
                          <th className="px-3 py-2 text-left">
                            Email
                          </th>
                          <th className="px-3 py-2 text-left">
                            Course
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {preview.sample.map(
                          (
                            row
                          ) => (
                            <tr
                              key={
                                row.rowNumber
                              }
                            >
                              <td className="px-3 py-2 text-slate-800">
                                {
                                  row.name ||
                                  "—"
                                }
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {
                                  row.phone ||
                                  "—"
                                }
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {
                                  row.email ||
                                  "—"
                                }
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {
                                  row.course ||
                                  "—"
                                }
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Dataset Name"
                required
              >
                <input
                  required
                  value={
                    form.name
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "name",
                      event.target.value
                    )
                  }
                  className="form-input"
                  placeholder="NEET 2026 Aspirants"
                />
              </Field>

              <Field
                label="Type"
                required
              >
                <select
                  value={
                    form.type
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "type",
                      event.target.value
                    )
                  }
                  className="form-input"
                >
                  {TYPES.map(
                    (
                      type
                    ) => (
                      <option
                        key={
                          type.api
                        }
                        value={
                          type.api
                        }
                      >
                        {
                          type.label
                        }
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Source">
                <input
                  value={
                    form.sourceName
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "sourceName",
                      event.target.value
                    )
                  }
                  className="form-input"
                  placeholder="Justdial / College Expo"
                />
              </Field>

              <Field label="Assign Imported Leads To">
                <select
                  value={
                    form.assignedToUserId
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "assignedToUserId",
                      event.target.value
                    )
                  }
                  className="form-input"
                >
                  <option value="">
                    Unassigned
                  </option>

                  {assignees.map(
                    (
                      user
                    ) => (
                      <option
                        key={
                          user.id
                        }
                        value={
                          user.id
                        }
                      >
                        {user.name} · {user.role.replaceAll("_", " ")}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field
                label="Notes"
                full
              >
                <textarea
                  rows={3}
                  value={
                    form.notes
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "notes",
                      event.target.value
                    )
                  }
                  className="form-input min-h-[86px] py-2"
                />
              </Field>
            </div>

            <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg px-3 py-2.5 text-[13px] text-indigo-800 leading-5">
              Imported leads are added directly to the CRM with source <strong>Lead Store</strong>. Duplicate phone/email rows are skipped.
            </div>
          </div>

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
                saving ||
                previewing ||
                !preview
              }
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm"
            >
              {saving ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <FileSpreadsheet
                  size={14}
                />
              )}

              {saving
                ? "Importing..."
                : "Import Leads"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditDatasetModal({
  dataset,
  assignees,
  onClose,
  onSaved,
}) {
  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    form,
    setForm,
  ] =
    useState({
      name:
        dataset.name ||
        "",
      type:
        dataset.type ||
        "EXTERNAL_DATA",
      sourceName:
        dataset.sourceName ||
        "",
      assignedToUserId:
        dataset
          .assignedToUser
          ?.id ||
        "",
      notes:
        dataset.notes ||
        "",
    });

  function update(
    field,
    value
  ) {
    setForm(
      (current) => ({
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
    setSaving(true);
    setError("");

    try {
      await apiRequest(
        `/api/client/lead-store/${dataset.id}`,
        {
          method:
            "PATCH",
          body:
            JSON.stringify(
              form
            ),
        }
      );

      onSaved();
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to update dataset"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-white/70 w-full max-w-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-semibold">
              Edit Dataset
            </h2>

            <p className="text-[13px] text-slate-500 mt-1">
              Assignment changes are also applied to the dataset's imported CRM leads.
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
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100"
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
          <div className="p-6 grid md:grid-cols-2 gap-4">
            {error && (
              <div className="md:col-span-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-[15px] text-rose-700">
                {error}
              </div>
            )}

            <Field
              label="Dataset Name"
              required
            >
              <input
                required
                value={
                  form.name
                }
                onChange={(
                  event
                ) =>
                  update(
                    "name",
                    event.target.value
                  )
                }
                className="form-input"
              />
            </Field>

            <Field label="Type">
              <select
                value={
                  form.type
                }
                onChange={(
                  event
                ) =>
                  update(
                    "type",
                    event.target.value
                  )
                }
                className="form-input"
              >
                {TYPES.map(
                  (
                    type
                  ) => (
                    <option
                      key={
                        type.api
                      }
                      value={
                        type.api
                      }
                    >
                      {
                        type.label
                      }
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Source">
              <input
                value={
                  form.sourceName
                }
                onChange={(
                  event
                ) =>
                  update(
                    "sourceName",
                    event.target.value
                  )
                }
                className="form-input"
              />
            </Field>

            <Field label="Assigned To">
              <select
                value={
                  form.assignedToUserId
                }
                onChange={(
                  event
                ) =>
                  update(
                    "assignedToUserId",
                    event.target.value
                  )
                }
                className="form-input"
              >
                <option value="">
                  Unassigned
                </option>

                {assignees.map(
                  (
                    user
                  ) => (
                    <option
                      key={
                        user.id
                      }
                      value={
                        user.id
                      }
                    >
                      {user.name} · {user.role.replaceAll("_", " ")}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field
              label="Notes"
              full
            >
              <textarea
                rows={3}
                value={
                  form.notes
                }
                onChange={(
                  event
                ) =>
                  update(
                    "notes",
                    event.target.value
                  )
                }
                className="form-input min-h-[86px] py-2"
              />
            </Field>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex justify-end gap-2">
            <button
              type="button"
              onClick={
                onClose
              }
              className="h-9 px-4 border border-slate-200 bg-white rounded-lg text-[13px] font-semibold text-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving
              }
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[13px] font-semibold inline-flex items-center gap-2"
            >
              {saving && (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              )}

              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MiniPill({
  label,
  value,
  tone = "slate",
}) {
  const tones = {
    slate:
      "bg-white border-slate-200 text-slate-700",
    emerald:
      "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber:
      "bg-amber-50 border-amber-200 text-amber-700",
    rose:
      "bg-rose-50 border-rose-200 text-rose-700",
  };

  return (
    <div
      className={`px-2 py-1 border rounded-md text-[11px] font-semibold ${
        tones[
          tone
        ] ||
        tones.slate
      }`}
    >
      {label}:{" "}
      <span className="font-bold">
        {value}
      </span>
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

export default function LeadStore({ selectedYear = "all" }) {
  const [
    sub,
    setSub,
  ] =
    useState(
      "external"
    );

  const [
    datasets,
    setDatasets,
  ] =
    useState([]);

  const [
    assignees,
    setAssignees,
  ] =
    useState([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    showIndividual,
    setShowIndividual,
  ] =
    useState(false);

  const [
    showUpload,
    setShowUpload,
  ] =
    useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState(null);

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  async function loadDatasets() {
    setLoading(true);
    setError("");

    try {
      const data =
        await apiRequest(
          `/api/client/lead-store?year=${encodeURIComponent(selectedYear)}`
        );

      setDatasets(
        data.datasets ||
          []
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

  async function loadAssignees() {
    try {
      const data =
        await apiRequest(
          "/api/client/lead-store/meta/assignees"
        );

      setAssignees(
        data.users ||
          []
      );
    } catch {
      setAssignees(
        []
      );
    }
  }

  useEffect(() => {
    loadDatasets();
    loadAssignees();
  }, [selectedYear]);

  const filtered =
    useMemo(
      () => {
        const selected =
          TYPES.find(
            (
              type
            ) =>
              type.key ===
              sub
          );

        const query =
          search
            .trim()
            .toLowerCase();

        return datasets.filter(
          (
            dataset
          ) => {
            const typeMatches =
              !selected ||
              dataset.type ===
                selected.api;

            const searchMatches =
              !query ||
              [
                dataset.name,
                dataset.sourceName,
                dataset.sourceFileName,
                dataset.assignedTo,
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

            return (
              typeMatches &&
              searchMatches
            );
          }
        );
      },
      [
        datasets,
        sub,
        search,
      ]
    );

  async function removeDataset(
    dataset
  ) {
    const ok =
      window.confirm(
        `Delete "${dataset.name}"?\n\nThe imported leads will remain in CRM. Only the dataset grouping will be removed.`
      );

    if (!ok) {
      return;
    }

    try {
      const data =
        await apiRequest(
          `/api/client/lead-store/${dataset.id}`,
          {
            method:
              "DELETE",
          }
        );

      setSuccessMessage(
        data.message
      );

      await loadDatasets();
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to delete dataset"
      );
    }
  }

  const totalLeads =
    datasets.reduce(
      (
        sum,
        dataset
      ) =>
        sum +
        Number(
          dataset.count ||
            0
        ),
      0
    );

  const totalConverted =
    datasets.reduce(
      (
        sum,
        dataset
      ) =>
        sum +
        Number(
          dataset.converted ||
            0
        ),
      0
    );

  const assignedDatasets =
    datasets.filter(
      (
        dataset
      ) =>
        Boolean(
          dataset
            .assignedToUser
        )
    ).length;

  const duplicatesSkipped =
    datasets.reduce(
      (
        sum,
        dataset
      ) =>
        sum +
        Number(
          dataset.duplicateCount ||
            0
        ),
      0
    );

  return (
    <div className="space-y-4">
      <style>{`
        .form-input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border: 1px solid rgb(226 232 240);
          border-radius: 8px;
          font-size: 14px;
          background: white;
          color: rgb(15 23 42);
          outline: none;
        }
        .form-input:focus {
          border-color: rgb(129 140 248);
          box-shadow: 0 0 0 3px rgb(224 231 255);
        }
      `}</style>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Data / Lead inventory
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Lead Store
          </h1>

          <p className="mt-1 text-[15px] text-slate-500">
            Import, validate, assign and track external lead datasets as real CRM leads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={
              loadDatasets
            }
            disabled={
              loading
            }
            className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-[13px] font-semibold text-slate-700 inline-flex items-center gap-2 shadow-sm"
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
              setShowIndividual(
                true
              )
            }
            className="h-9 px-3.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm"
          >
            <UserPlus
              size={14}
            />
            Add Lead
          </button>

          <button
            type="button"
            onClick={() =>
              setShowUpload(
                true
              )
            }
            className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm"
          >
            <Plus
              size={14}
            />
            Import Leads
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StoreMetric
          label="Datasets"
          value={
            datasets.length
          }
          icon={
            Database
          }
          detail="Lead datasets currently stored"
          tone="indigo"
        />

        <StoreMetric
          label="Imported Leads"
          value={
            totalLeads.toLocaleString(
              "en-IN"
            )
          }
          icon={
            Users
          }
          detail="Real CRM leads imported from datasets"
          tone="slate"
        />

        <StoreMetric
          label="Converted"
          value={
            totalConverted.toLocaleString(
              "en-IN"
            )
          }
          icon={
            UserCheck
          }
          detail="Imported leads that reached Admitted"
          tone="emerald"
        />

        <StoreMetric
          label="Duplicates Skipped"
          value={
            duplicatesSkipped.toLocaleString(
              "en-IN"
            )
          }
          icon={
            Layers3
          }
          detail={`${assignedDatasets} datasets currently assigned`}
          tone="amber"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex flex-col md:flex-row md:items-center gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex gap-1 overflow-x-auto">
          {TYPES.map(
            (
              type
            ) => (
              <button
                key={
                  type.key
                }
                type="button"
                onClick={() =>
                  setSub(
                    type.key
                  )
                }
                className={`px-3 py-2 text-[13px] font-semibold border-b-2 whitespace-nowrap ${
                  sub ===
                  type.key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {
                  type.label
                }
              </button>
            )
          )}
        </div>

        <div className="relative md:ml-auto w-full md:w-[320px]">
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
            placeholder="Search dataset, source, file or assignee..."
            className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
          />
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[15px]">
          <CheckCircle2
            size={15}
          />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[15px]">
          <AlertCircle
            size={15}
          />
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 flex justify-center gap-2 text-[15px] text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
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
              "Imported",
              "Skipped",
              "Uploaded",
              "Assigned To",
              "Converted",
              "Conversion",
              "Actions",
            ]}
            empty="No datasets found"
            rows={filtered.map(
              (
                dataset
              ) => {
                const conversion =
                  dataset.count >
                  0
                    ? (
                        (dataset.converted /
                          dataset.count) *
                        100
                      ).toFixed(
                        1
                      )
                    : "0.0";

                return (
                  <tr
                    key={
                      dataset.id
                    }
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="text-[15px] font-medium text-slate-900">
                        {
                          dataset.name
                        }
                      </div>

                      {dataset.sourceFileName && (
                        <div className="text-[11px] text-slate-400 mt-0.5 inline-flex items-center gap-1">
                          <FileSpreadsheet
                            size={10}
                          />
                          {
                            dataset.sourceFileName
                          }
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-2.5">
                      <Badge tone="slate">
                        {
                          dataset.typeLabel
                        }
                      </Badge>
                    </td>

                    <td className="px-4 py-2.5 text-[15px] text-slate-600">
                      {dataset.sourceName ||
                        "—"}
                    </td>

                    <td className="px-4 py-2.5 text-[15px] text-slate-700 font-medium">
                      {Number(
                        dataset.count
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    <td className="px-4 py-2.5 text-[13px] text-slate-500">
                      <div>
                        Dup:{" "}
                        {
                          dataset.duplicateCount ||
                          0
                        }
                      </div>
                      <div>
                        Invalid:{" "}
                        {
                          dataset.failedCount ||
                          0
                        }
                      </div>
                    </td>

                    <td className="px-4 py-2.5 text-[15px] text-slate-500">
                      {
                        formatDate(
                          dataset.uploadedAt
                        )
                      }
                    </td>

                    <td className="px-4 py-2.5 text-[15px] text-slate-700">
                      {
                        dataset.assignedTo
                      }
                    </td>

                    <td className="px-4 py-2.5 text-[15px] text-emerald-700 font-medium">
                      {
                        dataset.converted
                      }
                    </td>

                    <td className="px-4 py-2.5 text-[15px]">
                      {conversion}%
                    </td>

                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setEditing(
                              dataset
                            )
                          }
                          title="Edit dataset"
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Pencil
                            size={14}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeDataset(
                              dataset
                            )
                          }
                          title="Delete dataset"
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2
                            size={14}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
            )}
          />
        </div>
      )}

      {showIndividual && (
        <IndividualLeadModal
          assignees={
            assignees
          }
          onClose={() =>
            setShowIndividual(
              false
            )
          }
          onCreated={async (
            data
          ) => {
            setShowIndividual(
              false
            );

            setSuccessMessage(
              `${data.lead.name} added successfully. It is now available in Leads.`
            );
          }}
        />
      )}

      {showUpload && (
        <UploadDatasetModal
          assignees={
            assignees
          }
          onClose={() =>
            setShowUpload(
              false
            )
          }
          onImported={async (
            data
          ) => {
            setShowUpload(
              false
            );

            setSuccessMessage(
              `${data.importSummary.imported} leads imported · ${data.importSummary.duplicates} duplicates skipped · ${data.importSummary.failed} invalid rows skipped`
            );

            await loadDatasets();
          }}
        />
      )}

      {editing && (
        <EditDatasetModal
          dataset={
            editing
          }
          assignees={
            assignees
          }
          onClose={() =>
            setEditing(
              null
            )
          }
          onSaved={async () => {
            setEditing(
              null
            );

            setSuccessMessage(
              "Dataset updated successfully"
            );

            await loadDatasets();
          }}
        />
      )}
    </div>
  );
}
