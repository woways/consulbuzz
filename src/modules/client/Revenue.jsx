import {
  useEffect,
  useState,
} from "react";

import {
  TrendingUp,
  DollarSign,
  Clock,
  ArrowUpRight,
  Receipt,
  Award,
  Plus,
  Loader2,
  RefreshCw,
  X,
  Check,
  Ban,
  Wallet,
  AlertCircle,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  Badge,
} from "../../components/ui";

import { apiRequest } from "../../lib/api";

function money(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;
}

function axisMoney(value) {
  const amount =
    Number(value || 0);

  if (
    Math.abs(amount) >=
    10000000
  ) {
    return `₹${(
      amount / 10000000
    ).toFixed(1)}Cr`;
  }

  if (
    Math.abs(amount) >=
    100000
  ) {
    return `₹${(
      amount / 100000
    ).toFixed(1)}L`;
  }

  if (
    Math.abs(amount) >= 1000
  ) {
    return `₹${(
      amount / 1000
    ).toFixed(0)}k`;
  }

  return `₹${amount}`;
}

function dateText(value) {
  if (!value) return "—";

  const date =
    new Date(value);

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

function statusTone(status) {
  if (
    status === "APPROVED" ||
    status === "PAID"
  ) {
    return "emerald";
  }

  if (
    status === "REJECTED"
  ) {
    return "rose";
  }

  return "amber";
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

function ExpenseModal({
  onClose,
  onCreated,
}) {
  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      title: "",
      category: "",
      description: "",
      amount: "",
      expenseDate:
        new Date()
          .toISOString()
          .slice(0, 10),
      paymentMode: "",
      transactionRef: "",
      vendorName: "",
      invoiceNumber: "",
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
        "/api/client/revenue/expenses",
        {
          method: "POST",

          body: JSON.stringify({
            ...form,
            amount:
              Number(
                form.amount
              ),
          }),
        }
      );

      onCreated();
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to create expense"
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
            <h2 className="font-semibold">
              Add Expense
            </h2>

            <p className="text-xs text-slate-500">
              Expense remains pending
              until approved.
            </p>
          </div>

          <button
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="p-6 grid md:grid-cols-2 gap-4">
            {error && (
              <div className="md:col-span-2 bg-rose-50 text-rose-700 border border-rose-200 rounded p-2 text-sm">
                {error}
              </div>
            )}

            <Field
              label="Expense Title"
              required
              value={form.title}
              onChange={(value) =>
                update(
                  "title",
                  value
                )
              }
              placeholder="Google Ads"
            />

            <Field
              label="Category"
              required
              value={
                form.category
              }
              onChange={(value) =>
                update(
                  "category",
                  value
                )
              }
              placeholder="Marketing"
            />

            <Field
              label="Amount"
              required
              type="number"
              value={form.amount}
              onChange={(value) =>
                update(
                  "amount",
                  value
                )
              }
              placeholder="50000"
            />

            <Field
              label="Expense Date"
              required
              type="date"
              value={
                form.expenseDate
              }
              onChange={(value) =>
                update(
                  "expenseDate",
                  value
                )
              }
            />

            <Field
              label="Payment Mode"
              value={
                form.paymentMode
              }
              onChange={(value) =>
                update(
                  "paymentMode",
                  value
                )
              }
              placeholder="UPI / Bank"
            />

            <Field
              label="Transaction Ref"
              value={
                form.transactionRef
              }
              onChange={(value) =>
                update(
                  "transactionRef",
                  value
                )
              }
            />

            <Field
              label="Vendor"
              value={
                form.vendorName
              }
              onChange={(value) =>
                update(
                  "vendorName",
                  value
                )
              }
            />

            <Field
              label="Invoice Number"
              value={
                form.invoiceNumber
              }
              onChange={(value) =>
                update(
                  "invoiceNumber",
                  value
                )
              }
            />

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Description
              </label>

              <textarea
                rows={3}
                value={
                  form.description
                }
                onChange={(event) =>
                  update(
                    "description",
                    event.target.value
                  )
                }
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors"
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
              disabled={saving}
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              {saving
                ? "Creating..."
                : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IncentiveModal({
  onClose,
  onCreated,
}) {
  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      employeeName: "",
      title: "",
      description: "",
      amount: "",
      incentiveDate:
        new Date()
          .toISOString()
          .slice(0, 10),
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
        "/api/client/revenue/incentives",
        {
          method: "POST",

          body: JSON.stringify({
            ...form,
            amount:
              Number(
                form.amount
              ),
          }),
        }
      );

      onCreated();
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to create incentive"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-white/70 w-full max-w-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between">
          <div>
            <h2 className="font-semibold">
              Add Incentive
            </h2>

            <p className="text-xs text-slate-500">
              Incentive affects profit
              only after approval.
            </p>
          </div>

          <button
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded p-2 text-sm">
                {error}
              </div>
            )}

            <Field
              label="Employee / Counsellor"
              required
              value={
                form.employeeName
              }
              onChange={(value) =>
                update(
                  "employeeName",
                  value
                )
              }
              placeholder="ABC Counsellor"
            />

            <Field
              label="Title"
              value={form.title}
              onChange={(value) =>
                update(
                  "title",
                  value
                )
              }
              placeholder="Admission Incentive"
            />

            <Field
              label="Amount"
              required
              type="number"
              value={form.amount}
              onChange={(value) =>
                update(
                  "amount",
                  value
                )
              }
              placeholder="10000"
            />

            <Field
              label="Incentive Date"
              required
              type="date"
              value={
                form.incentiveDate
              }
              onChange={(value) =>
                update(
                  "incentiveDate",
                  value
                )
              }
            />

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Description
              </label>

              <textarea
                rows={3}
                value={
                  form.description
                }
                onChange={(event) =>
                  update(
                    "description",
                    event.target.value
                  )
                }
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors"
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
              disabled={saving}
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              {saving
                ? "Creating..."
                : "Add Incentive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function RevenueMetric({
  label,
  value,
  icon: Icon,
  detail,
  tone = "indigo",
  featured = false,
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <div
      className={`border rounded-xl p-4 transition-all ${
        featured
          ? "bg-slate-950 border-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
          : "bg-white border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className={`text-[10px] font-semibold uppercase tracking-[0.09em] ${
              featured ? "text-slate-400" : "text-slate-400"
            }`}
          >
            {label}
          </div>

          <div
            className={`mt-2 text-xl leading-none font-bold tracking-tight ${
              featured ? "text-white" : "text-slate-950"
            }`}
          >
            {value}
          </div>
        </div>

        <div
          className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
            featured
              ? "bg-white/10 border-white/10 text-white"
              : tones[tone] || tones.indigo
          }`}
        >
          <Icon size={17} />
        </div>
      </div>

      <div
        className={`mt-3 pt-3 border-t text-[11px] ${
          featured
            ? "border-white/10 text-slate-400"
            : "border-slate-100 text-slate-500"
        }`}
      >
        {detail}
      </div>
    </div>
  );
}

export default function Revenue({ selectedYear = "all" }) {
  const [tab, setTab] =
    useState("overview");

  const [data, setData] =
    useState({
      summary: {},
      monthlyRevenue: [],
      expenses: [],
      incentives: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    showExpense,
    setShowExpense,
  ] = useState(false);

  const [
    showIncentive,
    setShowIncentive,
  ] = useState(false);

  async function loadRevenue() {
    setLoading(true);
    setError("");

    try {
      const result =
        await apiRequest(
          `/api/client/revenue?year=${encodeURIComponent(selectedYear)}`
        );

      setData(result);
    } catch (error) {
      setError(
        error?.data?.message ||
          "Unable to load revenue"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRevenue();
  }, [selectedYear]);

  async function expenseStatus(
    id,
    status
  ) {
    await apiRequest(
      `/api/client/revenue/expenses/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
        }),
      }
    );

    await loadRevenue();
  }

  async function incentiveStatus(
    id,
    status
  ) {
    await apiRequest(
      `/api/client/revenue/incentives/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
        }),
      }
    );

    await loadRevenue();
  }

  const summary =
    data.summary || {};

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Finance / Revenue management
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Revenue
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor collections, outstanding revenue, approved costs, incentives and operating profit.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRevenue}
          disabled={loading}
          className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-2 shadow-sm"
        >
          <RefreshCw
            size={13}
            className={loading ? "animate-spin" : ""}
          />
          Refresh data
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2
            size={16}
            className="animate-spin"
          />
          Loading revenue...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <RevenueMetric
              label="Potential Revenue"
              value={money(summary.potentialRevenue)}
              icon={TrendingUp}
              detail="Total admission value"
              tone="indigo"
            />

            <RevenueMetric
              label="Received"
              value={money(summary.receivedAmount)}
              icon={DollarSign}
              detail="Collections received"
              tone="emerald"
            />

            <RevenueMetric
              label="Pending"
              value={money(summary.pendingAmount)}
              icon={Clock}
              detail="Outstanding collections"
              tone="amber"
            />

            <RevenueMetric
              label="Approved Expenses"
              value={money(summary.approvedExpenses)}
              icon={Receipt}
              detail="Approved operating costs"
              tone="rose"
            />

            <RevenueMetric
              label="Current Profit"
              value={money(summary.currentProfit)}
              icon={ArrowUpRight}
              detail="Received less approved costs"
              featured
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] inline-flex gap-1">
            {[
              ["overview", "Overview"],
              ["expenses", "Expenses"],
              ["incentives", "Incentives"],
            ].map(([item, label]) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  tab === item
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab ===
            "overview" && (
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <h3 className="font-semibold text-sm text-slate-900 mb-1">
                  Monthly Revenue
                </h3>

                <div className="text-xs text-slate-500 mb-5">
                  Potential versus collected revenue by month
                </div>

                <ResponsiveContainer
                  width="100%"
                  height={280}
                >
                  <LineChart
                    data={
                      data.monthlyRevenue
                    }
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />

                    <XAxis
                      dataKey="m"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />

                    <YAxis
                      tickFormatter={
                        axisMoney
                      }
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />

                    <Tooltip
                      formatter={
                        money
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="potential"
                      name="Potential"
                      stroke="#cbd5e1"
                    />

                    <Line
                      type="monotone"
                      dataKey="received"
                      name="Received"
                      stroke="#6366f1"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <h3 className="font-semibold text-sm text-slate-900 mb-1">
                  Breakdown
                </h3>

                <div className="text-xs text-slate-500 mb-5">
                  Current financial position
                </div>

                <div className="space-y-3 text-sm">
                  <Row
                    label="Received"
                    value={money(
                      summary.receivedAmount
                    )}
                  />

                  <Row
                    label="- Approved Expenses"
                    value={money(
                      summary.approvedExpenses
                    )}
                  />

                  <Row
                    label="- Incentives"
                    value={money(
                      summary.totalIncentives
                    )}
                  />

                  <div className="border-t pt-3">
                    <Row
                      label="Current Profit"
                      value={money(
                        summary.currentProfit
                      )}
                      bold
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab ===
            "expenses" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() =>
                    setShowExpense(true)
                  }
                  className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
                >
                  <Plus size={14} />
                  Add Expense
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Expense
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.expenses.map(
                      (expense) => (
                        <tr
                          key={
                            expense.id
                          }
                          className="border-t border-slate-100 hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="px-4 py-3">
                            {
                              expense.title
                            }
                          </td>

                          <td className="px-4 py-3">
                            {
                              expense.category
                            }
                          </td>

                          <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">
                            {money(
                              expense.amount
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {dateText(
                              expense.expenseDate
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <Badge
                              tone={statusTone(
                                expense.status
                              )}
                            >
                              {
                                expense.status
                              }
                            </Badge>
                          </td>

                          <td className="px-4 py-3">
                            {expense.status ===
                              "PENDING" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    expenseStatus(
                                      expense.id,
                                      "APPROVED"
                                    )
                                  }
                                  className="w-8 h-8 rounded-lg border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 inline-flex items-center justify-center"
                                >
                                  <Check
                                    size={
                                      16
                                    }
                                  />
                                </button>

                                <button
                                  onClick={() =>
                                    expenseStatus(
                                      expense.id,
                                      "REJECTED"
                                    )
                                  }
                                  className="w-8 h-8 rounded-lg border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 inline-flex items-center justify-center"
                                >
                                  <Ban
                                    size={
                                      16
                                    }
                                  />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    )}

                    {!data.expenses
                      .length && (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-slate-500"
                        >
                          No expenses yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab ===
            "incentives" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() =>
                    setShowIncentive(
                      true
                    )
                  }
                  className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
                >
                  <Plus size={14} />
                  Add Incentive
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.incentives.map(
                      (incentive) => (
                        <tr
                          key={
                            incentive.id
                          }
                          className="border-t border-slate-100 hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="px-4 py-3">
                            {
                              incentive.employeeName
                            }
                          </td>

                          <td className="px-4 py-3">
                            {incentive.title ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">
                            {money(
                              incentive.amount
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {dateText(
                              incentive.incentiveDate
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <Badge
                              tone={statusTone(
                                incentive.status
                              )}
                            >
                              {
                                incentive.status
                              }
                            </Badge>
                          </td>

                          <td className="px-4 py-3">
                            {incentive.status ===
                              "PENDING" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    incentiveStatus(
                                      incentive.id,
                                      "APPROVED"
                                    )
                                  }
                                  className="w-8 h-8 rounded-lg border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 inline-flex items-center justify-center"
                                >
                                  <Check
                                    size={
                                      16
                                    }
                                  />
                                </button>

                                <button
                                  onClick={() =>
                                    incentiveStatus(
                                      incentive.id,
                                      "REJECTED"
                                    )
                                  }
                                  className="w-8 h-8 rounded-lg border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 inline-flex items-center justify-center"
                                >
                                  <Ban
                                    size={
                                      16
                                    }
                                  />
                                </button>
                              </div>
                            )}

                            {incentive.status ===
                              "APPROVED" && (
                              <button
                                onClick={() =>
                                  incentiveStatus(
                                    incentive.id,
                                    "PAID"
                                  )
                                }
                                className="h-8 px-2.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 rounded-lg inline-flex items-center gap-1.5"
                              >
                                <Wallet
                                  size={
                                    12
                                  }
                                />
                                Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    )}

                    {!data.incentives
                      .length && (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-slate-500"
                        >
                          No incentives
                          yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showExpense && (
        <ExpenseModal
          onClose={() =>
            setShowExpense(false)
          }
          onCreated={async () => {
            setShowExpense(false);
            await loadRevenue();
          }}
        />
      )}

      {showIncentive && (
        <IncentiveModal
          onClose={() =>
            setShowIncentive(false)
          }
          onCreated={async () => {
            setShowIncentive(
              false
            );
            await loadRevenue();
          }}
        />
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}) {
  return (
    <div
      className={`flex justify-between ${
        bold
          ? "font-semibold"
          : ""
      }`}
    >
      <span className="text-slate-600">
        {label}
      </span>

      <span>{value}</span>
    </div>
  );
}
