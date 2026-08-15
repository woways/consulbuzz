import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Puzzle,
  Activity,
  DollarSign,
  Ticket,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ChevronDown,
  UserRound,
  KeyRound,
  History,
  X,
  Save,
  Loader2,
} from "lucide-react";

import {
  Badge,
} from "./components/ui";

import {
  apiRequest,
} from "./lib/api";

import AdminDashboard from "./modules/admin/AdminDashboard";
import Clients from "./modules/admin/Clients";
import Client360 from "./modules/admin/Client360";
import Plans from "./modules/admin/Plans";
import Modules from "./modules/admin/Modules";
import Usage from "./modules/admin/Usage";
import Billing from "./modules/admin/Billing";
import Support from "./modules/admin/Support";
import Analytics from "./modules/admin/Analytics";
import SystemSettings from "./modules/admin/SystemSettings";
import ActivityLog from "./modules/admin/ActivityLog";

const MENU = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "clients",
    label: "Clients",
    icon: Building2,
  },
  {
    key: "plans",
    label:
      "Plans & Subscriptions",
    icon: CreditCard,
  },
  {
    key: "modules",
    label: "Modules",
    icon: Puzzle,
  },
  {
    key: "usage",
    label: "Usage",
    icon: Activity,
  },
  {
    key: "billing",
    label: "Billing",
    icon: DollarSign,
  },
  {
    key: "support",
    label: "Support",
    icon: Ticket,
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    key: "activity-log",
    label: "Activity Log",
    icon: History,
  },
  {
    key: "system",
    label:
      "System Settings",
    icon: Settings,
  },
];

export default function SuperAdmin() {
  const nav =
    useNavigate();

  const [
    section,
    setSection,
  ] = useState(
    "dashboard"
  );

  const [
    selectedClient,
    setSelectedClient,
  ] = useState(null);

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  const [
    signingOut,
    setSigningOut,
  ] = useState(false);

  const [adminUser, setAdminUser] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "", jobTitle: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const profileMenuRef = useRef(null);

  useEffect(() => {
    apiRequest("/api/admin/auth/me").then((data) => {
      setAdminUser(data.user);
      setProfileForm({ name: data.user?.name || "", email: data.user?.email || "", phone: data.user?.phone || "", jobTitle: data.user?.jobTitle || "" });
    }).catch((error) => console.error("Load admin profile failed:", error));
  }, []);

  useEffect(() => {
    function outside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) setProfileMenuOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  function adminInitials() {
    return String(adminUser?.name || "Admin").trim().split(/\s+/).filter(Boolean).slice(0,2).map((word)=>word[0]).join("").toUpperCase() || "AD";
  }

  async function saveProfile(event) {
    event.preventDefault(); setProfileSaving(true); setAccountError(""); setAccountMessage("");
    try { const data = await apiRequest("/api/admin/auth/profile", { method: "PATCH", body: JSON.stringify(profileForm) }); setAdminUser(data.user); setProfileForm({name:data.user.name||"",email:data.user.email||"",phone:data.user.phone||"",jobTitle:data.user.jobTitle||""}); setAccountMessage(data.message||"Profile updated successfully"); }
    catch(error){ setAccountError(error?.data?.message||"Unable to update profile"); } finally { setProfileSaving(false); }
  }

  async function changePassword(event) {
    event.preventDefault(); setPasswordSaving(true); setAccountError(""); setAccountMessage("");
    try { const data=await apiRequest("/api/admin/auth/change-password",{method:"PATCH",body:JSON.stringify(passwordForm)}); setAccountMessage(data.message||"Password changed successfully"); setTimeout(()=>nav("/admin/login",{replace:true}),900); }
    catch(error){ setAccountError(error?.data?.message||"Unable to change password"); } finally { setPasswordSaving(false); }
  }

  async function logout() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    try {
      await apiRequest(
        "/api/admin/auth/logout",
        {
          method: "POST",
        }
      );
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      nav(
        "/admin/login",
        {
          replace: true,
        }
      );
    }
  }

  function stub(label) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="text-base font-bold text-slate-900">
          {label}
        </div>

        <div className="text-sm text-slate-500 mt-2">
          This module will be implemented
          in the next production phase.
        </div>
      </div>
    );
  }

  function renderSection() {
    if (
      selectedClient
    ) {
      return (
        <Client360
          clientId={
            selectedClient
          }
          onBack={() =>
            setSelectedClient(
              null
            )
          }
        />
      );
    }

    switch (section) {
      case "dashboard":
        return (
          <AdminDashboard
            onGoto={
              setSection
            }
          />
        );

      case "clients":
        return (
          <Clients
            onSelect={
              setSelectedClient
            }
          />
        );

      case "plans":
        return <Plans />;

      case "modules":
        return <Modules />;

      case "usage":
        return <Usage />;

      case "billing":
        return <Billing />;

      case "support":
        return <Support />;

      case "analytics":
        return <Analytics />;

      case "activity-log":
        return <ActivityLog />;

      case "system":
        return (
          <SystemSettings />
        );

      default:
        return stub(
          MENU.find(
            (item) =>
              item.key ===
              section
          )?.label ||
            "Section"
        );
    }
  }

  const currentLabel =
    selectedClient
      ? "Client 360"
      : MENU.find(
          (item) =>
            item.key ===
            section
        )?.label ||
        "Dashboard";

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">

      {/* HEADER */}

      <header className="h-[70px] bg-white border-b border-slate-200 sticky top-0 z-40 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="h-full px-5 flex items-center justify-between gap-4">

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-white text-sm font-bold flex items-center justify-center shadow-sm">
              CB
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-[15px] font-bold text-slate-950">
                  ConsulBuzz
                </div>

                <Badge tone="rose">
                  Super Admin
                </Badge>
              </div>

              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                Internal control center
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search clients, modules or settings..."
                className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative w-9 h-9 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell
                size={17}
              />

              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>

            <div ref={profileMenuRef} className="relative">
              <button type="button" onClick={()=>setProfileMenuOpen((current)=>!current)} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                <div className="hidden sm:block text-right"><div className="text-xs font-semibold text-slate-800">{adminUser?.name || "ConsulBuzz Admin"}</div><div className="text-[10px] text-slate-500">Super Admin</div></div>
                <div className="w-9 h-9 rounded-full bg-slate-950 text-white text-xs font-semibold flex items-center justify-center">{adminInitials()}</div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100"><div className="text-sm font-semibold text-slate-900">{adminUser?.name || "Super Admin"}</div><div className="text-xs text-slate-500 mt-0.5 truncate">{adminUser?.email || "—"}</div></div>
                  <div className="p-1.5">
                    <button type="button" onClick={()=>{setProfileMenuOpen(false);setAccountError("");setAccountMessage("");setProfileOpen(true);}} className="w-full px-3 py-2.5 rounded-lg text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"><UserRound size={14}/>Account Profile</button>
                    <button type="button" onClick={()=>{setProfileMenuOpen(false);setAccountError("");setAccountMessage("");setPasswordForm({currentPassword:"",newPassword:"",confirmPassword:""});setPasswordOpen(true);}} className="w-full px-3 py-2.5 rounded-lg text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"><KeyRound size={14}/>Change Password</button>
                    <button type="button" onClick={()=>{setProfileMenuOpen(false);setSelectedClient(null);setSection("activity-log");}} className="w-full px-3 py-2.5 rounded-lg text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"><History size={14}/>Activity Log</button>
                  </div>
                  <div className="p-1.5 border-t border-slate-100"><button type="button" onClick={logout} disabled={signingOut} className="w-full px-3 py-2.5 rounded-lg text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 disabled:opacity-50"><LogOut size={14}/>{signingOut?"Signing out...":"Sign out"}</button></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">

        {/* SIDEBAR */}

        <aside
          className={`relative bg-[#071321] text-slate-300 min-h-[calc(100vh-70px)] sticky top-[70px] self-start flex-shrink-0 border-r border-white/[0.04] transition-[width] duration-300 ${
            sidebarCollapsed
              ? "w-[76px]"
              : "w-[248px]"
          }`}
        >
          <div className="h-[calc(100vh-70px)] flex flex-col">

            {!sidebarCollapsed && (
              <div className="px-5 pt-5 pb-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-600 font-semibold flex items-center gap-2">
                  <Shield
                    size={12}
                  />
                  Administration
                </div>
              </div>
            )}

            {sidebarCollapsed && (
              <div className="h-4" />
            )}

            <nav className="flex-1 overflow-y-auto py-1">
              {MENU.map(
                (item) => {
                  const Icon =
                    item.icon;

                  const active =
                    section ===
                      item.key &&
                    !selectedClient;

                  return (
                    <button
                      key={
                        item.key
                      }
                      type="button"
                      title={
                        sidebarCollapsed
                          ? item.label
                          : undefined
                      }
                      onClick={() => {
                        setSection(
                          item.key
                        );

                        setSelectedClient(
                          null
                        );
                      }}
                      className={`relative w-full flex items-center py-3 text-[13px] font-semibold transition-colors ${
                        sidebarCollapsed
                          ? "justify-center px-2"
                          : "gap-3 px-4"
                      } ${
                        active
                          ? "bg-[#18304b] text-white"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-400" />
                      )}

                      <Icon
                        size={17}
                        className={
                          active
                            ? "text-indigo-300"
                            : "text-slate-500"
                        }
                      />

                      {!sidebarCollapsed && (
                        <span className="flex-1 text-left">
                          {
                            item.label
                          }
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </nav>

            {!sidebarCollapsed && (
              <div className="border-t border-slate-800 px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-slate-600">
                  Current section
                </div>

                <div className="text-xs font-semibold text-slate-300 mt-1.5">
                  {
                    currentLabel
                  }
                </div>

                <div className="text-[11px] text-slate-500 mt-1">
                  Restricted staff access
                </div>
              </div>
            )}
          </div>

          {/* EDGE COLLAPSE */}

          <button
            type="button"
            onClick={() =>
              setSidebarCollapsed(
                (current) =>
                  !current
              )
            }
            title={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            aria-label={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            className="absolute right-0 top-1/2 z-30 w-8 h-8 translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white text-slate-600 shadow-md flex items-center justify-center hover:bg-slate-50 hover:text-slate-950 hover:shadow-lg transition-all"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen
                size={15}
              />
            ) : (
              <PanelLeftClose
                size={15}
              />
            )}
          </button>
        </aside>

        {/* MAIN */}

        <main className="flex-1 min-w-0 p-6 lg:p-7">
          <div className="max-w-[1600px] mx-auto">
            {
              renderSection()
            }
          </div>
        </main>
      </div>

      {profileOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/55 flex items-center justify-center p-4">
          <form onSubmit={saveProfile} className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between"><div><div className="text-base font-bold text-slate-950">Super Admin Profile</div><div className="text-xs text-slate-500 mt-1">Update your administrator account.</div></div><button type="button" onClick={()=>setProfileOpen(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X size={16}/></button></div>
            <div className="p-5 space-y-4">{accountError&&<div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-xs">{accountError}</div>}{accountMessage&&<div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-xs">{accountMessage}</div>}
              {[['name','Name','text'],['email','Email','email'],['phone','Phone','text'],['jobTitle','Job Title','text']].map(([key,label,type])=><div key={key}><label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label><input type={type} value={profileForm[key]} onChange={(e)=>setProfileForm((c)=>({...c,[key]:e.target.value}))} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"/></div>)}
              <div className="flex justify-end gap-2"><button type="button" onClick={()=>setProfileOpen(false)} className="h-9 px-4 border border-slate-200 rounded-lg text-xs font-semibold">Cancel</button><button type="submit" disabled={profileSaving} className="h-9 px-4 bg-slate-950 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2">{profileSaving?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>}Save Profile</button></div>
            </div>
          </form>
        </div>
      )}
      {passwordOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/55 flex items-center justify-center p-4">
          <form onSubmit={changePassword} className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between"><div><div className="text-base font-bold text-slate-950">Change Password</div><div className="text-xs text-slate-500 mt-1">You will be signed out after success.</div></div><button type="button" onClick={()=>setPasswordOpen(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X size={16}/></button></div>
            <div className="p-5 space-y-4">{accountError&&<div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-xs">{accountError}</div>}{accountMessage&&<div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-xs">{accountMessage}</div>}
              {[['currentPassword','Current Password'],['newPassword','New Password'],['confirmPassword','Confirm New Password']].map(([key,label])=><div key={key}><label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label><input type="password" value={passwordForm[key]} onChange={(e)=>setPasswordForm((c)=>({...c,[key]:e.target.value}))} className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"/></div>)}
              <div className="text-[11px] text-slate-500">At least 8 characters with uppercase, lowercase and a number.</div><div className="flex justify-end gap-2"><button type="button" onClick={()=>setPasswordOpen(false)} className="h-9 px-4 border border-slate-200 rounded-lg text-xs font-semibold">Cancel</button><button type="submit" disabled={passwordSaving} className="h-9 px-4 bg-slate-950 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2">{passwordSaving?<Loader2 size={13} className="animate-spin"/>:<KeyRound size={13}/>}Change Password</button></div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
