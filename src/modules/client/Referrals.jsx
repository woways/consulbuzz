import { useEffect, useState } from "react";

import { apiRequest } from "../../lib/api";

import ReferralHome from "./ReferralHome";
import MyReferrals from "./MyReferrals";

export default function Referrals({ currentUser }) {
  const [tab, setTab] = useState("home"); // "home" | "referrals" | "earnings"

  // Shared code + stats for the Home tab (My Referrals fetches its own).
  const [code, setCode] = useState("");
  const [stats, setStats] = useState({ total: 0, admitted: 0, inProgress: 0 });

  async function loadSummary() {
    try {
      const data = await apiRequest("/api/client/referrals/me");
      setCode(data.code || "");
      setStats(data.stats || { total: 0, admitted: 0, inProgress: 0 });
    } catch (e) {
      // non-fatal for the home tab
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  const TABS = [
    { key: "home", label: "Home" },
    { key: "referrals", label: "My Referrals" },
    { key: "earnings", label: "Earnings" },
  ];

  return (
    <div className="space-y-5">
      {/* Header + tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-500">Rewards</div>
          <h1 className="text-[24px] font-black tracking-[-0.02em] text-slate-900">Referrals</h1>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                tab === t.key ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "home" && (
        <ReferralHome
          currentUser={currentUser}
          code={code}
          stats={stats}
          onGoReferrals={() => setTab("referrals")}
        />
      )}

      {tab === "referrals" && <MyReferrals currentUser={currentUser} />}

      {tab === "earnings" && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center shadow-sm">
          <div className="text-[16px] font-black text-slate-700">Earnings coming soon</div>
          <p className="mx-auto mt-2 max-w-md text-[13px] text-slate-500">
            Reward tracking, redeemable balance, and withdrawals will appear here once the rewards
            system is enabled for your company.
          </p>
        </div>
      )}
    </div>
  );
}
