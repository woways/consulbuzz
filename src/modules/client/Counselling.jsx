
import {
  Plus,
  Calendar,
  Video,
  TrendingUp,
  Clock,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import {
  Badge,
  statusTone,
} from "../../components/ui";

import {
  MOCK_COUNSELLING,
} from "../../data/mock";

function CounsellingMetric({
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

export default function Counselling() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Engagement / Counselling
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Counselling
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage counselling sessions, meeting links,
            student context, remarks and follow-up activity.
          </p>
        </div>

        <button
          type="button"
          className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={14} />
          Schedule Session
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <CounsellingMetric
          label="Sessions Today"
          value="6"
          icon={Calendar}
          detail="Counselling sessions scheduled today"
          tone="indigo"
        />

        <CounsellingMetric
          label="This Week"
          value="24"
          icon={Video}
          detail="Total sessions during the current week"
          tone="slate"
        />

        <CounsellingMetric
          label="Conversion Rate"
          value="38%"
          icon={TrendingUp}
          detail="Sessions progressing toward conversion"
          tone="emerald"
        />

        <CounsellingMetric
          label="Pending Follow-ups"
          value="12"
          icon={Clock}
          detail="Sessions requiring another interaction"
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
            type="text"
            placeholder="Search student, course, counsellor or session..."
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

      <div className="space-y-3">
        {MOCK_COUNSELLING.map(
          (session) => (
            <div
              key={session.id}
              className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-[15px] font-bold text-slate-950">
                        {session.student}
                      </div>

                      <Badge tone="slate">
                        {session.course}
                      </Badge>

                      <Badge
                        tone={statusTone(
                          session.status
                        )}
                      >
                        {session.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mt-5">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-slate-400">
                          When
                        </div>

                        <div className="text-sm font-semibold text-slate-800 mt-1">
                          {session.date}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-slate-400">
                          Counsellor
                        </div>

                        <div className="text-sm font-semibold text-slate-800 mt-1">
                          {session.counsellor}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-slate-400">
                          Mode
                        </div>

                        <div className="text-sm font-semibold text-slate-800 mt-1">
                          {session.mode}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-slate-400">
                          Came With
                        </div>

                        <div className="text-sm font-semibold text-slate-800 mt-1">
                          {session.accompaniedBy}
                        </div>
                      </div>
                    </div>

                    {session.link !==
                      "—" && (
                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                        <div className="h-8 max-w-full inline-flex items-center gap-2 text-xs font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 rounded-lg">
                          <Video
                            size={12}
                          />

                          <span className="truncate">
                            {session.link}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="h-8 px-2.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1.5"
                        >
                          <Copy
                            size={12}
                          />
                          Copy
                        </button>

                        <button
                          type="button"
                          className="h-8 px-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg inline-flex items-center gap-1.5"
                        >
                          <ExternalLink
                            size={12}
                          />
                          Join
                        </button>
                      </div>
                    )}

                    {session.remarks !==
                      "—" && (
                      <div className="mt-4 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                        <span className="font-semibold text-slate-700">
                          Remarks:
                        </span>{" "}

                        <span className="text-slate-600">
                          {session.remarks}
                        </span>
                      </div>
                    )}

                    {session.followUp !==
                      "—" && (
                      <div className="mt-3 text-xs font-medium text-slate-500 inline-flex items-center gap-1.5">
                        <Clock
                          size={12}
                        />
                        Follow-up:
                        <span className="text-slate-700">
                          {session.followUp}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="w-8 h-8 flex-shrink-0 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <MoreHorizontal
                      size={16}
                    />
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
