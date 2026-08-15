import {
  Plus,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
} from "lucide-react";

import {
  Table,
  Badge,
  statusTone,
} from "../../components/ui";

import {
  MOCK_WALKINS,
} from "../../data/mock";

function WalkinMetric({
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

        <div
          className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
            tones[tone] ||
            tones.indigo
          }`}
        >
          <Icon size={17} />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        {detail}
      </div>
    </div>
  );
}

export default function Walkins() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Leads / Offline engagement
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Walk-ins
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track every office visitor, their purpose,
            counsellor interaction and conversion outcome.
          </p>
        </div>

        <button
          type="button"
          className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={14} />
          Log Walk-in
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <WalkinMetric
          label="Walk-ins"
          value="48"
          icon={UserPlus}
          detail="Visitors recorded this month"
          tone="indigo"
        />

        <WalkinMetric
          label="Converted to Lead"
          value="34"
          icon={ArrowUpRight}
          detail="Visitors converted into CRM leads"
          tone="emerald"
        />

        <WalkinMetric
          label="In Progress"
          value="8"
          icon={Clock}
          detail="Walk-ins requiring follow-up"
          tone="amber"
        />

        <WalkinMetric
          label="Lost"
          value="6"
          icon={ArrowDownRight}
          detail="Visitors closed without conversion"
          tone="rose"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1 max-w-lg">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search visitor, phone, purpose or counsellor..."
            className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
          />
        </div>

        <button
          type="button"
          className="h-9 px-3 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-2 sm:ml-auto"
        >
          <SlidersHorizontal size={13} />
          Filters
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <Table
          columns={[
            "Arrived",
            "Visitor",
            "Phone",
            "Purpose",
            "Came With",
            "Counsellor",
            "Outcome",
            "Status",
            "",
          ]}
          rows={MOCK_WALKINS.map(
            (walkin) => (
              <tr
                key={walkin.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {walkin.arrived}
                </td>

                <td className="px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">
                    {walkin.name}
                  </div>
                </td>

                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {walkin.phone}
                </td>

                <td className="px-4 py-3 text-sm text-slate-700">
                  {walkin.purpose}
                </td>

                <td className="px-4 py-3 text-sm text-slate-600">
                  {walkin.accompaniedBy}
                </td>

                <td className="px-4 py-3 text-sm font-medium text-slate-700">
                  {walkin.counsellor}
                </td>

                <td className="px-4 py-3 text-sm text-slate-600">
                  {walkin.outcome}
                </td>

                <td className="px-4 py-3">
                  <Badge
                    tone={statusTone(
                      walkin.status
                    )}
                  >
                    {walkin.status}
                  </Badge>
                </td>

                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <MoreHorizontal
                      size={15}
                    />
                  </button>
                </td>
              </tr>
            )
          )}
        />
      </div>
    </div>
  );
}
