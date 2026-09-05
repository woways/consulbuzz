import { useEffect, useState } from "react";

import {
  Loader2,
  Copy,
  Check,
  Share2,
  Users,
  TrendingUp,
  Gift,
  ChevronDown,
} from "lucide-react";

import { apiRequest } from "../../lib/api";

function initialsOf(name) {
  return String(name || "?").split(" ").filter(Boolean).slice(0, 2)
    .map((p) => p[0]).join("").toUpperCase();
}

/* ---- Interactive "How referral works" pipeline ---- */
const HOW_STEPS = [
  { label: "Share", title: "Share your referral link", body: "Copy your unique code or link and send it to anyone — via WhatsApp, email, or a QR code. Every share is tracked to you.", icon: Share2 },
  { label: "They refer", title: "They get referred", body: "When the person enters the pipeline, they're tagged to you. No manual work — the system links them to your referral.", icon: Users },
  { label: "Track", title: "Track their progress", body: "Watch each referral move through the stages live. Nudge them with a reminder whenever they stall.", icon: TrendingUp },
  { label: "Earn", title: "Earn your reward", body: "When your referral reaches the reward stage, your earning unlocks automatically.", icon: Gift },
];

const FAQS = [
  ["How do I refer someone?", "Copy your referral link or code from your profile and share it. When they enter the pipeline, they're tagged to you automatically."],
  ["When do I earn my reward?", "Rewards unlock as your referral progresses through the stages. The exact amount depends on your tier."],
  ["How much can I earn per referral?", "Up to the highest tier amount per successful referral, depending on how many you've converted. Earnings are exclusive of applicable TDS."],
  ["Where do I see my referrals?", "Open the My Referrals tab to see everyone you've referred and their current stage, updated live."],
];

export default function ReferralHome({ currentUser, code, stats, onGoReferrals }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState("");
  const [openFaq, setOpenFaq] = useState(-1);

  const link = code ? `${window.location.origin}/r/${code}` : "";
  const Step = HOW_STEPS[active];

  function copy(text, which) {
    try {
      navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(""), 1400);
    } catch (e) {}
  }

  return (
    <div className="space-y-5">
      {/* profile + activity */}
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* profile card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[28px] font-black text-white">
            {initialsOf(currentUser?.name)}
          </div>
          <div className="mt-3 text-[18px] font-black text-slate-900">{currentUser?.name || "You"}</div>
          <div className="mt-0.5 text-[13px] text-slate-500">
            {currentUser?.jobTitle || currentUser?.department || "Referrer"}
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active referrer
          </div>

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Your referral code</div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-[16px] font-black tracking-wide text-slate-900">{code || "…"}</span>
              <button type="button" onClick={() => copy(code, "code")} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-brand-700">
                {copied === "code" ? <Check size={12} /> : <Copy size={12} />}
                {copied === "code" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(`Check this out: ${link}`)}`} target="_blank" rel="noreferrer" className="rounded-xl bg-brand-600 py-2.5 text-[12px] font-bold text-white hover:bg-brand-700">WhatsApp</a>
            <button type="button" onClick={() => copy(link, "link")} className="rounded-xl border border-slate-200 py-2.5 text-[12px] font-bold text-slate-700 hover:bg-slate-50">
              {copied === "link" ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>

        {/* activity summary */}
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Total referrals</div><div className="mt-1 text-[30px] font-black text-slate-900">{stats?.total ?? 0}</div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Admitted</div><div className="mt-1 text-[30px] font-black text-emerald-600">{stats?.admitted ?? 0}</div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">In progress</div><div className="mt-1 text-[30px] font-black text-amber-600">{stats?.inProgress ?? 0}</div></div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-black text-slate-900">Ready to refer more?</div>
              <button type="button" onClick={onGoReferrals} className="text-[12px] font-bold text-brand-600 hover:text-brand-700">Go to My Referrals →</button>
            </div>
            <p className="mt-1 text-[13px] text-slate-500">Share your link and watch your referrals progress live.</p>
          </div>
        </div>
      </div>

      {/* interactive pipeline */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between bg-gradient-to-r from-brand-700 to-brand-900 px-6 py-5 text-white">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-200">How referral works</div>
            <div className="text-[20px] font-black tracking-tight">From share to reward in 4 steps</div>
          </div>
          <div className="hidden rounded-full bg-white/10 px-4 py-2 text-[12px] font-bold text-brand-100 sm:block">Tap a step to learn more</div>
        </div>
        <div className="px-6 py-8 sm:px-10">
          <div className="relative">
            <div className="pointer-events-none absolute top-[23px] hidden h-1 sm:block" style={{ left: "19%", width: "12%" }}><div className="h-1 w-full rounded-full bg-brand-500" /></div>
            <div className="pointer-events-none absolute top-[23px] hidden h-1 sm:block" style={{ left: "44%", width: "12%" }}><div className="h-1 w-full rounded-full bg-brand-500" /></div>
            <div className="pointer-events-none absolute top-[23px] hidden h-1 sm:block" style={{ left: "69%", width: "12%" }}><div className="h-1 w-full rounded-full bg-brand-500" /></div>
            <div className="relative z-10 grid grid-cols-4 gap-2">
              {HOW_STEPS.map((s, i) => {
                const Icon = s.icon;
                const on = i === active;
                return (
                  <button key={s.label} type="button" onClick={() => setActive(i)} className="group flex flex-col items-center gap-3 text-center">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition ${on ? "scale-110 opacity-100 shadow-[0_12px_30px_rgba(79,70,229,.35)]" : "opacity-60 group-hover:scale-105 group-hover:opacity-90"}`}>
                      <Icon size={18} />
                    </span>
                    <span className={`text-[13px] font-black ${on ? "text-brand-700" : "text-slate-900"}`}>{s.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-7 rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
              <div className="text-[15px] font-black text-brand-800">{Step.title}</div>
              <div className="mt-1 text-[13px] text-slate-600">{Step.body}</div>
            </div>
          </div>
        </div>
      </div>

      {/* milestones (display only) -->*/}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 p-7 text-white shadow-sm">
        <h2 className="text-[24px] font-black tracking-tight">Referral Milestones</h2>
        <p className="mt-1 text-[14px] text-brand-200">Earn more as you refer more.</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-white/[0.08] p-5"><div className="flex items-center gap-2"><span className="text-[18px] font-black">Tier 1</span><span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-bold">1–2 conversions</span></div><div className="mt-3 text-[12px] text-brand-200">Base reward per referral</div></div>
          <div className="rounded-2xl bg-white/[0.08] p-5"><div className="flex items-center gap-2"><span className="text-[18px] font-black">Tier 2</span><span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-bold">3–5 conversions</span></div><div className="mt-3 text-[12px] text-brand-200">Higher reward per referral</div></div>
          <div className="relative rounded-2xl bg-white/[0.12] p-5 ring-1 ring-yellow-300/40"><span className="absolute -right-2 -top-2 text-lg">🏅</span><div className="flex items-center gap-2"><span className="text-[18px] font-black">Tier 3</span><span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-bold">5+ conversions</span></div><div className="mt-3 text-[12px] text-brand-200">Top reward per referral</div></div>
        </div>
        <p className="mt-4 text-[12px] text-brand-200">Reward amounts are configured by your company.</p>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-[22px] font-black tracking-tight text-slate-900">Frequently asked questions</h2>
        <div className="mt-4 space-y-2.5">
          {FAQS.map(([q, a], i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                <span className="text-[15px] font-bold text-slate-900">{q}</span>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <div className="px-5 pb-4 text-[13px] leading-relaxed text-slate-500">{a}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
