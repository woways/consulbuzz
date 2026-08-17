import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Bell,
  LogOut,
  Lock,
  Crown,
  Loader2,
  ChevronDown,
  LayoutDashboard,
  Megaphone,
  GraduationCap,
  WalletCards,
  BarChart3,
  LifeBuoy,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle,
  ReceiptIndianRupee,
  CalendarClock,
} from "lucide-react";

import {
  MODULE_META,
} from "./data/tenants";

import {
  PlanPill,
  UpgradeGate,
} from "./components/ui";

import {
  apiRequest,
} from "./lib/api";

import Dashboard from "./modules/client/Dashboard";
import UTMLeads from "./modules/client/UTMLeads";
import Admissions from "./modules/client/Admissions";
import Revenue from "./modules/client/Revenue";
import LeadStore from "./modules/client/LeadStore";
import Walkins from "./modules/client/Walkins";
import Counselling from "./modules/client/Counselling";
import Analytics from "./modules/client/Analytics";
import Help from "./modules/client/Help";
import SettingsView from "./modules/client/Settings";

const NAV_GROUPS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    items: ["dashboard"],
    direct: true,
  },

  {
    key: "leads",
    label: "Leads",
    icon: Megaphone,
    items: [
      "utm-leads",
      "lead-store",
    ],
  },

  {
    key: "admissions",
    label: "Admissions",
    icon: GraduationCap,
    items: [
      "admissions",
      "walkins",
      "counselling",
    ],
  },

  {
    key: "finance",
    label: "Finance",
    icon: WalletCards,
    items: [
      "revenue",
    ],
  },

  {
    key: "insights",
    label: "Insights",
    icon: BarChart3,
    items: [
      "analytics",
    ],
  },

  {
    key: "support",
    label: "Support",
    icon: LifeBuoy,
    items: [
      "help",
    ],
  },

  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    items: [
      "settings",
    ],
    direct: true,
  },
];

const MODULE_PERMISSION_MAP = {
  dashboard:
    "canViewAnalytics",
  "utm-leads":
    "canManageLeads",
  "lead-store":
    "canManageLeads",
  admissions:
    "canManageAdmissions",
  walkins:
    "canManageAdmissions",
  counselling:
    "canManageAdmissions",
  revenue:
    "canManageRevenue",
  analytics:
    "canViewAnalytics",
  help:
    "canManageSupport",
  settings:
    "canManageSettings",
};

const MODULE_PERMISSION_LABELS = {
  canManageLeads:
    "manage leads",
  canManageAdmissions:
    "manage admissions",
  canManageRevenue:
    "manage revenue",
  canViewAnalytics:
    "view analytics",
  canManageSupport:
    "manage support",
  canManageSettings:
    "manage company settings",
};

function getAccent(
  color
) {
  const colors = {
    indigo:
      "bg-indigo-600",

    blue:
      "bg-blue-600",

    emerald:
      "bg-emerald-600",

    amber:
      "bg-amber-600",

    rose:
      "bg-rose-600",

    purple:
      "bg-purple-600",

    slate:
      "bg-slate-700",
  };

  return (
    colors[color] ||
    "bg-indigo-600"
  );
}

export default function ClientPortal({
  clientSession,
}) {
  const navigate =
    useNavigate();

  const [
    module,
    setModule,
  ] = useState(
    "dashboard"
  );

  const [
    signingOut,
    setSigningOut,
  ] = useState(
    false
  );

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    unreadNotificationCount,
    setUnreadNotificationCount,
  ] = useState(0);

  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(false);

  const [
    notificationError,
    setNotificationError,
  ] = useState("");

  const notificationRef =
    useRef(null);

  const [
    profileMenuOpen,
    setProfileMenuOpen,
  ] = useState(false);
const [accountActionsOpen, setAccountActionsOpen] = useState(false);

  const profileMenuRef =
    useRef(null);

  const [
    changePasswordOpen,
    setChangePasswordOpen,
  ] = useState(false);

  const [
    passwordForm,
    setPasswordForm,
  ] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [
    passwordVisibility,
    setPasswordVisibility,
  ] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [
    passwordSaving,
    setPasswordSaving,
  ] = useState(false);

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    passwordMessage,
    setPasswordMessage,
  ] = useState("");

  const [
    billingOpen,
    setBillingOpen,
  ] = useState(false);

  const [
    billingData,
    setBillingData,
  ] = useState({
    subscription: null,
    plans: [],
    payments: [],
  });

  const [
    billingLoading,
    setBillingLoading,
  ] = useState(false);

  const [
    billingError,
    setBillingError,
  ] = useState("");

  const [
    paymentProcessing,
    setPaymentProcessing,
  ] = useState("");

  const [
    openGroups,
    setOpenGroups,
  ] = useState({
    leads: true,
    admissions: true,
    finance: true,
    insights: true,
    support: true,
  });

  const [
    liveCompany,
    setLiveCompany,
  ] = useState(
    clientSession?.company ||
      null
  );

  useEffect(() => {
    setLiveCompany(
      clientSession?.company ||
        null
    );
  }, [
    clientSession,
  ]);

  const company =
    liveCompany;

  const user =
    clientSession?.user;

  const permissions =
    user?.permissions ||
    {};

  function hasModulePermission(
    moduleKey
  ) {
    if (
      user?.role ===
      "CLIENT_ADMIN"
    ) {
      return true;
    }

    const permission =
      MODULE_PERMISSION_MAP[
        moduleKey
      ];

    if (!permission) {
      return true;
    }

    return (
      permissions[
        permission
      ] === true
    );
  }

  function permissionMessage(
    moduleKey
  ) {
    const permission =
      MODULE_PERMISSION_MAP[
        moduleKey
      ];

    const label =
      MODULE_PERMISSION_LABELS[
        permission
      ] ||
      "access this module";

    return `You don't have permission to ${label}.`;
  }

  const enabledFeatures =
    useMemo(() => {
      return (
        company?.modules
          ?.filter(
            (item) =>
              item.enabled
          )
          .map(
            (item) =>
              item.key
          ) || []
      );
    }, [
      company,
    ]);

  const plan =
    company
      ?.subscription
      ?.plan
      ?.key ||
    "basic";

  const tenant =
    useMemo(
      () => ({
        id:
          company?.slug,

        slug:
          company?.slug,

        name:
          company?.name ||
          "Company",

        brandName:
          company?.brandName ||
          company?.name ||
          "CRM",

        short:
          company?.shortName ||
          "CB",

        accent:
          getAccent(
            company?.primaryColor
          ),

        subdomain:
          company?.subdomain ||
          "",

        owner:
          company?.ownerName ||
          user?.name ||
          "Admin",

        ownerName:
          company?.ownerName ||
          user?.name ||
          "Admin",

        business:
          company?.business ||
          "",

        city:
          company?.city ||
          "",

        leads:
          0,

        admissions:
          0,

        mrr:
          company
            ?.subscription
            ?.plan
            ?.monthlyPrice ||
          0,

        plan,
      }),

      [
        company,
        user,
        plan,
      ]
    );

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setNotificationsOpen(false);
      }

      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(
          event.target
        )
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  async function loadNotifications() {
    setNotificationsLoading(true);
    setNotificationError("");

    try {
      const data = await apiRequest(
        "/api/client/notifications?limit=20"
      );

      setNotifications(data.notifications || []);
      setUnreadNotificationCount(
        Number(data.unreadCount || 0)
      );
    } catch (error) {
      console.error("Unable to load notifications:", error);
      setNotificationError(
        error?.data?.message ||
          "Unable to load notifications"
      );
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function loadUnreadNotificationCount() {
    try {
      const data = await apiRequest(
        "/api/client/notifications/unread-count"
      );

      setUnreadNotificationCount(
        Number(data.unreadCount || 0)
      );
    } catch (error) {
      console.error(
        "Unable to load notification count:",
        error
      );
    }
  }

  async function markNotificationRead(notification) {
    if (!notification.read) {
      try {
        await apiRequest(
          `/api/client/notifications/${notification.id}/read`,
          { method: "PATCH" }
        );

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  read: true,
                  readAt: new Date().toISOString(),
                }
              : item
          )
        );

        setUnreadNotificationCount((current) =>
          Math.max(0, current - 1)
        );
      } catch (error) {
        console.error(
          "Unable to mark notification as read:",
          error
        );
      }
    }

    if (notification.actionModule) {
      setModule(notification.actionModule);
    }

    setNotificationsOpen(false);
  }

  async function markAllNotificationsRead() {
    try {
      await apiRequest(
        "/api/client/notifications/read-all",
        { method: "PATCH" }
      );

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read: true,
          readAt:
            item.readAt ||
            new Date().toISOString(),
        }))
      );

      setUnreadNotificationCount(0);
    } catch (error) {
      console.error(
        "Unable to mark all notifications as read:",
        error
      );
    }
  }

  useEffect(() => {
    loadUnreadNotificationCount();

    const interval = window.setInterval(
      loadUnreadNotificationCount,
      60000
    );

    return () => window.clearInterval(interval);
  }, []);

  async function signOut() {
    if (
      signingOut
    ) {
      return;
    }

    setSigningOut(
      true
    );

    try {
      await apiRequest(
        "/api/client/auth/logout",
        {
          method:
            "POST",
        }
      );
    } catch (error) {
      console.error(
        "Client logout failed:",
        error
      );
    } finally {
      navigate(
        "/login",
        {
          replace:
            true,
        }
      );
    }
  }

  function openChangePassword() {
    setProfileMenuOpen(false);
    setPasswordError("");
    setPasswordMessage("");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setChangePasswordOpen(true);
  }

  function updatePasswordField(
    field,
    value
  ) {
    setPasswordForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  async function submitPasswordChange(
    event
  ) {
    event.preventDefault();

    if (passwordSaving) {
      return;
    }

    setPasswordSaving(true);
    setPasswordError("");
    setPasswordMessage("");

    try {
      const data = await apiRequest(
        "/api/client/auth/change-password",
        {
          method: "PATCH",
          body: JSON.stringify(
            passwordForm
          ),
        }
      );

      setPasswordMessage(
        data.message ||
          "Password changed successfully"
      );

      window.setTimeout(() => {
        navigate(
          "/login",
          {
            replace: true,
          }
        );
      }, 900);
    } catch (error) {
      setPasswordError(
        error?.data?.message ||
          "Unable to change password"
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  async function loadBillingData() {
    setBillingLoading(true);
    setBillingError("");

    try {
      const data = await apiRequest(
        "/api/client/billing"
      );

      setBillingData({
        subscription:
          data.subscription || null,
        plans:
          data.plans || [],
        payments:
          data.payments || [],
      });
    } catch (error) {
      setBillingError(
        error?.data?.message ||
          "Unable to load subscription billing"
      );
    } finally {
      setBillingLoading(false);
    }
  }

  async function openBilling() {
    setProfileMenuOpen(false);
    setBillingOpen(true);
    await loadBillingData();
  }

  function loadRazorpayCheckout() {
    return new Promise(
      (resolve, reject) => {
        if (window.Razorpay) {
          resolve();
          return;
        }

        const existing =
          document.querySelector(
            'script[data-consulbuzz-razorpay="true"]'
          );

        if (existing) {
          existing.addEventListener(
            "load",
            () => resolve()
          );
          existing.addEventListener(
            "error",
            () =>
              reject(
                new Error(
                  "Unable to load Razorpay Checkout"
                )
              )
          );
          return;
        }

        const script =
          document.createElement(
            "script"
          );

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.dataset.consulbuzzRazorpay =
          "true";

        script.onload = () =>
          resolve();

        script.onerror = () =>
          reject(
            new Error(
              "Unable to load Razorpay Checkout"
            )
          );

        document.body.appendChild(
          script
        );
      }
    );
  }

  async function startSubscriptionPayment(
    planKey,
    billingCycle
  ) {
    const paymentKey =
      `${planKey}:${billingCycle}`;

    setPaymentProcessing(
      paymentKey
    );
    setBillingError("");

    try {
      await loadRazorpayCheckout();

      const orderData =
        await apiRequest(
          "/api/client/billing/create-order",
          {
            method: "POST",
            body: JSON.stringify({
              planKey,
              billingCycle,
            }),
          }
        );

      const razorpay =
        new window.Razorpay({
          key: orderData.keyId,
          amount:
            orderData.order.amount,
          currency:
            orderData.order.currency,
          name: "ConsulBuzz",
          description:
            `${orderData.plan.name} ${billingCycle.toLowerCase()} subscription`,
          order_id:
            orderData.order.id,
          prefill: {
            name: user.name,
            email: user.email,
            contact:
              company.phone || "",
          },
          notes: {
            company:
              company.name,
            plan:
              orderData.plan.name,
          },
          theme: {
            color: "#4f46e5",
          },
          handler: async (
            response
          ) => {
            try {
              const verified =
                await apiRequest(
                  "/api/client/billing/verify-payment",
                  {
                    method: "POST",
                    body: JSON.stringify(
                      response
                    ),
                  }
                );

              await loadBillingData();

              if (verified.captured) {
                window.setTimeout(
                  () =>
                    window.location.reload(),
                  700
                );
              }
            } catch (error) {
              setBillingError(
                error?.data?.message ||
                  "Payment verification failed"
              );
            } finally {
              setPaymentProcessing(
                ""
              );
            }
          },
          modal: {
            ondismiss: () => {
              setPaymentProcessing(
                ""
              );
            },
          },
        });

      razorpay.on(
        "payment.failed",
        (response) => {
          setBillingError(
            response?.error
              ?.description ||
              "Payment failed. Please try again."
          );
          setPaymentProcessing(
            ""
          );
        }
      );

      razorpay.open();
    } catch (error) {
      setBillingError(
        error?.data?.message ||
          error?.message ||
          "Unable to start payment"
      );
      setPaymentProcessing("");
    }
  }

  function toggleGroup(
    key
  ) {
    setOpenGroups(
      (current) => ({
        ...current,

        [key]:
          !current[key],
      })
    );
  }

  function handleWorkspaceUpdated(
    workspace
  ) {
    if (!workspace) {
      return;
    }

    setLiveCompany(
      (current) => {
        if (!current) {
          return current;
        }

        const nextName =
          workspace.companyName ||
          current.name;

        const nextShortName =
          String(nextName)
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(
              (word) =>
                word[0]
            )
            .join("")
            .toUpperCase() ||
          current.shortName;

        return {
          ...current,
          name:
            nextName,
          shortName:
            nextShortName,
          brandName:
            workspace.portalName ||
            current.brandName,
          business:
            workspace.businessType ??
            current.business,
          subdomain:
            workspace.subdomain ||
            current.subdomain,
          primaryColor:
            workspace.primaryColor ||
            current.primaryColor,
          logoUrl:
            workspace.logoUrl ??
            current.logoUrl,
        };
      }
    );
  }

  function renderModule() {
    if (
      !hasModulePermission(
        module
      )
    ) {
      return (
        <div className="min-h-[420px] flex items-center justify-center">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Lock
                size={21}
              />
            </div>

            <div className="mt-4 text-base font-bold text-slate-950">
              Access restricted
            </div>

            <div className="mt-2 text-sm leading-6 text-slate-500">
              {
                permissionMessage(
                  module
                )
              }
            </div>

            <div className="mt-4 text-xs text-slate-400">
              Contact your Client Admin if you need access.
            </div>
          </div>
        </div>
      );
    }

    if (
      !enabledFeatures.includes(
        module
      )
    ) {
      return (
        <UpgradeGate
          module={
            module
          }
          currentPlan={
            plan
          }
          onUpgrade={() =>
            setModule(
              "help"
            )
          }
        />
      );
    }

    switch (
      module
    ) {
      case "dashboard":
        return (
          <Dashboard
            tenant={
              tenant
            }
            user={
              user
            }
          />
        );

      case "utm-leads":
        return (
          <UTMLeads />
        );

      case "admissions":
        return (
          <Admissions />
        );

      case "revenue":
        return (
          <Revenue />
        );

      case "lead-store":
        return (
          <LeadStore />
        );

      case "walkins":
        return (
          <Walkins />
        );

      case "counselling":
        return (
          <Counselling />
        );

      case "analytics":
        return (
          <Analytics />
        );

      case "help":
        return (
          <Help
            tenant={
              tenant
            }
            plan={
              plan
            }
          />
        );

      case "settings":
        return (
          <SettingsView
            tenant={
              tenant
            }
            primaryColor={
              company?.primaryColor
            }
            onWorkspaceUpdated={
              handleWorkspaceUpdated
            }
          />
        );

      default:
        return null;
    }
  }

  function renderDirectItem(
    group
  ) {
    const key =
      group.items[0];

    const active =
      module === key;

    const locked =
      !enabledFeatures.includes(
        key
      ) ||
      !hasModulePermission(
        key
      );

    const Icon =
      group.icon;

    return (
      <button
        key={
          group.key
        }
        type="button"
        title={
          sidebarCollapsed
            ? group.label
            : undefined
        }
        onClick={() =>
          setModule(
            key
          )
        }
        className={`relative w-full flex items-center py-3 text-[13px] font-semibold transition-all ${
          sidebarCollapsed
            ? "justify-center px-2"
            : "gap-3 px-4"
        } ${
          active
            ? "bg-[#18304b] text-white"
            : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-400" />
        )}

        <Icon
          size={
            17
          }
          className={
            active
              ? "text-indigo-300"
              : "text-slate-400"
          }
        />

        {!sidebarCollapsed && (
          <>
            <span className="flex-1 text-left">
              {
                group.label
              }
            </span>

            {locked && (
              <Lock
                size={
                  11
                }
                className="text-slate-600"
              />
            )}
          </>
        )}

        {sidebarCollapsed &&
          locked && (
            <span className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-slate-500" />
          )}
      </button>
    );
  }

  function renderChildItem(
    key
  ) {
    const meta =
      MODULE_META[
        key
      ];

    if (
      !meta
    ) {
      return null;
    }

    const Icon =
      meta.icon;

    const active =
      module === key;

    const locked =
      !enabledFeatures.includes(
        key
      ) ||
      !hasModulePermission(
        key
      );

    return (
      <button
        key={
          key
        }
        type="button"
        onClick={() =>
          setModule(
            key
          )
        }
        className={`relative w-full flex items-center gap-3 pl-[52px] pr-4 py-2.5 text-[13px] transition-all ${
          active
            ? "text-white bg-[#12283f]"
            : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-400" />
        )}

        <Icon
          size={
            14
          }
          className={
            active
              ? "text-indigo-300"
              : "text-slate-500"
          }
        />

        <span className="flex-1 text-left font-medium">
          {
            meta.label
          }
        </span>

        {locked && (
          <Lock
            size={
              11
            }
            className="text-slate-600"
          />
        )}

        {!locked &&
          meta.plan && (
            <Crown
              size={
                11
              }
              className={
                meta.plan ===
                "pro"
                  ? "text-indigo-400"
                  : "text-amber-400"
              }
            />
          )}
      </button>
    );
  }

  if (
    !company ||
    !user
  ) {
    return (
      <div className="min-h-screen bg-[#071321] flex items-center justify-center">
        <Loader2
          size={
            20
          }
          className="animate-spin text-indigo-500"
        />
      </div>
    );
  }

  const formatRole = (role) => {
    if (!role) return "User";

    return String(role)
      .toLowerCase()
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const initials =
    String(
      user.name
    )
      .split(
        " "
      )
      .filter(
        Boolean
      )
      .slice(
        0,
        2
      )
      .map(
        (part) =>
          part[0]
      )
      .join(
        ""
      )
      .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">

      <div className="flex">

        {/* SIDEBAR */}

        <aside
          className={`relative bg-[#071321] text-slate-300 min-h-screen sticky top-0 self-start flex-shrink-0 border-r border-white/[0.04] transition-[width] duration-300 ${
            sidebarCollapsed
              ? "w-[76px]"
              : "w-[258px]"
          }`}
        >
          <div className="h-screen flex flex-col">

            {/* WORKSPACE IDENTITY — shown once */}

            {!sidebarCollapsed ? (
              <div className="px-4 pt-5 pb-4">
                <div className="flex items-center gap-3 px-2">
                  <div
                    className={`w-9 h-9 rounded-xl ${getAccent(
                      company.primaryColor
                    )} text-white flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0`}
                  >
                    {company.shortName}
                  </div>

                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-white truncate">
                      {company.brandName}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {company.subdomain || "Company workspace"}
                    </div>
                  </div>
                </div>

                <div className="px-2 pt-5 pb-2">
                  <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-600">
                    Workspace
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-5 pb-4 flex justify-center">
                <div
                  className={`w-9 h-9 rounded-xl ${getAccent(
                    company.primaryColor
                  )} text-white flex items-center justify-center text-xs font-bold shadow-sm`}
                  title={company.brandName}
                >
                  {company.shortName}
                </div>
              </div>
            )}

            {/* NAVIGATION */}

            <nav className="flex-1 min-h-0 overflow-y-auto pb-3">

              {NAV_GROUPS.map(
                (group) => {

                  if (
                    group.direct
                  ) {
                    return renderDirectItem(
                      group
                    );
                  }

                  const GroupIcon =
                    group.icon;

                  const open =
                    Boolean(
                      openGroups[
                        group.key
                      ]
                    );

                  const groupActive =
                    group.items.includes(
                      module
                    );

                  if (
                    sidebarCollapsed
                  ) {
                    return (
                      <button
                        key={
                          group.key
                        }
                        type="button"
                        title={
                          group.label
                        }
                        onClick={() => {
                          setSidebarCollapsed(
                            false
                          );

                          setOpenGroups(
                            (current) => ({
                              ...current,
                              [group.key]:
                                true,
                            })
                          );
                        }}
                        className={`relative w-full flex items-center justify-center px-2 py-3 transition-colors ${
                          groupActive
                            ? "bg-[#18304b] text-white"
                            : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                        }`}
                      >
                        {groupActive && (
                          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-400" />
                        )}

                        <GroupIcon
                          size={
                            17
                          }
                          className={
                            groupActive
                              ? "text-indigo-300"
                              : "text-slate-400"
                          }
                        />
                      </button>
                    );
                  }

                  return (
                    <div
                      key={
                        group.key
                      }
                    >

                      <button
                        type="button"
                        onClick={() =>
                          toggleGroup(
                            group.key
                          )
                        }
                        className={`w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold transition-colors ${
                          groupActive
                            ? "text-white"
                            : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        <GroupIcon
                          size={
                            17
                          }
                          className={
                            groupActive
                              ? "text-indigo-300"
                              : "text-slate-400"
                          }
                        />

                        <span className="flex-1 text-left">
                          {
                            group.label
                          }
                        </span>

                        <ChevronDown
                          size={
                            14
                          }
                          className={`text-slate-500 transition-transform duration-200 ${
                            open
                              ? "rotate-0"
                              : "-rotate-90"
                          }`}
                        />
                      </button>

                      <div
                        className={`overflow-hidden transition-all duration-200 ${
                          open
                            ? "max-h-[300px] opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="relative">

                          <span className="absolute left-[37px] top-0 bottom-0 w-px bg-slate-800" />

                          {group.items.map(
                            (
                              key
                            ) =>
                              renderChildItem(
                                key
                              )
                          )}

                        </div>
                      </div>

                    </div>
                  );
                }
              )}

            </nav>

            {/* ACCOUNT — user + plan shown once */}

            <div className="border-t border-slate-800/80 p-3 pb-4 flex-shrink-0">
            {!sidebarCollapsed ? (
              <div className="relative">
                {accountActionsOpen && (
                  <div className="mb-2 rounded-xl border border-white/[0.07] bg-[#0b1a2b] p-1.5 shadow-xl">
                    <div
                      ref={notificationRef}
                      className="relative"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const nextOpen = !notificationsOpen;
                          setNotificationsOpen(nextOpen);
                          setProfileMenuOpen(false);

                          if (nextOpen) {
                            loadNotifications();
                          }
                        }}
                        className={`w-full h-9 px-2.5 rounded-lg flex items-center gap-2.5 text-[11px] font-semibold transition-colors ${
                          notificationsOpen
                            ? "bg-white/[0.08] text-white"
                            : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="relative">
                          <Bell size={14} />
                          {unreadNotificationCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[13px] h-[13px] px-0.5 rounded-full bg-rose-500 text-white text-[8px] font-bold leading-[13px] text-center">
                              {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                            </span>
                          )}
                        </div>
                        <span className="flex-1 text-left">Notifications</span>
                        {unreadNotificationCount > 0 && (
                          <span className="text-[10px] text-slate-500">
                            {unreadNotificationCount}
                          </span>
                        )}
                      </button>

                      {notificationsOpen && (
                        <div className="absolute left-full bottom-0 ml-3 w-[380px] max-w-[calc(100vw-24px)] bg-white border border-slate-200 rounded-xl shadow-[0_16px_40px_rgba(15,23,42,0.14)] overflow-hidden z-50 text-slate-900">
                          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-bold text-slate-950">Notifications</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Workspace updates and alerts
                              </div>
                            </div>
                            {unreadNotificationCount > 0 && (
                              <button
                                type="button"
                                onClick={markAllNotificationsRead}
                                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                              >
                                Mark all read
                              </button>
                            )}
                          </div>

                          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                            {notificationsLoading ? (
                              <div className="py-12 flex items-center justify-center gap-2 text-xs text-slate-500">
                                <Loader2 size={14} className="animate-spin text-indigo-600" />
                                Loading notifications...
                              </div>
                            ) : notificationError ? (
                              <div className="p-4">
                                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-3">
                                  {notificationError}
                                </div>
                                <button
                                  type="button"
                                  onClick={loadNotifications}
                                  className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                                >
                                  Try again
                                </button>
                              </div>
                            ) : notifications.length === 0 ? (
                              <div className="py-12 px-6 text-center">
                                <Bell size={20} className="mx-auto text-slate-300" />
                                <div className="text-xs font-semibold text-slate-700 mt-2">
                                  No notifications yet
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1">
                                  Important workspace updates will appear here.
                                </div>
                              </div>
                            ) : (
                              notifications.map((notification) => (
                                <button
                                  key={notification.id}
                                  type="button"
                                  onClick={() => markNotificationRead(notification)}
                                  className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                                    notification.read ? "bg-white" : "bg-indigo-50/35"
                                  }`}
                                >
                                  <div className="flex gap-3">
                                    <div
                                      className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                        notification.read ? "bg-slate-200" : "bg-indigo-500"
                                      }`}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-start justify-between gap-3">
                                        <div
                                          className={`text-xs ${
                                            notification.read
                                              ? "font-medium text-slate-800"
                                              : "font-bold text-slate-950"
                                          }`}
                                        >
                                          {notification.title}
                                        </div>
                                        <div className="text-[10px] text-slate-400 whitespace-nowrap">
                                          {new Date(notification.createdAt).toLocaleDateString(
                                            "en-IN",
                                            { day: "2-digit", month: "short" }
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-xs text-slate-500 mt-1 leading-5">
                                        {notification.message}
                                      </div>
                                      {notification.actionLabel && (
                                        <div className="text-[11px] font-semibold text-indigo-600 mt-2">
                                          {notification.actionLabel}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {(user.role === "CLIENT_ADMIN" ||
                      permissions.canManageBilling === true) && (
                      <button
                        type="button"
                        onClick={() => {
                          setAccountActionsOpen(false);
                          openBilling();
                        }}
                        className="w-full h-9 px-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] flex items-center gap-2.5 text-[11px] font-semibold transition-colors"
                      >
                        <ReceiptIndianRupee size={14} />
                        <span>Billing & Subscription</span>
                      </button>
                    )}

                    {(user.role === "CLIENT_ADMIN" ||
                      permissions.canManageSettings === true) && (
                      <button
                        type="button"
                        onClick={() => {
                          setAccountActionsOpen(false);
                          setModule("settings");
                        }}
                        className="w-full h-9 px-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] flex items-center gap-2.5 text-[11px] font-semibold transition-colors"
                      >
                        <Settings size={14} />
                        <span>Company Settings</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={signOut}
                      disabled={signingOut}
                      className="w-full h-9 px-2.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-white/[0.06] flex items-center gap-2.5 text-[11px] font-semibold transition-colors disabled:opacity-50"
                    >
                      {signingOut ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <LogOut size={14} />
                      )}
                      <span>Sign out</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setAccountActionsOpen((value) => !value);
                    setNotificationsOpen(false);
                  }}
                  className={`w-full rounded-xl px-2.5 py-2.5 flex items-center gap-2.5 text-left transition-colors ${
                    accountActionsOpen
                      ? "bg-white/[0.08]"
                      : "hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold text-white truncate">
                      {user.name || tenant.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {formatRole(user.role)} · {tenant.planName || tenant.plan}
                    </div>
                  </div>

                  <ChevronDown
                    size={14}
                    className={`text-slate-500 flex-shrink-0 transition-transform duration-200 ${
                      accountActionsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSidebarCollapsed(false);
                  setAccountActionsOpen(true);
                }}
                title={`${user.name || tenant.name} · ${formatRole(user.role)}`}
                className="w-full flex items-center justify-center"
              >
                <div className="relative w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {initials}
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-[#071321]" />
                  )}
                </div>
              </button>
            )}
          </div>

          </div>

          {/* COLLAPSE / EXPAND — SIDEBAR EDGE */}

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
                size={
                  15
                }
              />
            ) : (
              <PanelLeftClose
                size={
                  15
                }
              />
            )}
          </button>
        </aside>

        {/* MAIN CONTENT */}

        <main className="flex-1 min-w-0 p-6 lg:p-7">
          <div className="max-w-[1600px] mx-auto">
            {
              renderModule()
            }
          </div>
        </main>

      </div>

      {billingOpen && (
        <div className="fixed inset-0 z-[95] bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-slate-950">
                  Billing & Subscription
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  Manage the ConsulBuzz plan for {company.name}.
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setBillingOpen(false)
                }
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              {billingError && (
                <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <AlertCircle
                    size={14}
                    className="mt-0.5 flex-shrink-0"
                  />
                  {billingError}
                </div>
              )}

              {billingLoading ? (
                <div className="py-16 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Loading subscription...
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                        Current Subscription
                      </div>

                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {billingData.subscription
                          ?.plan?.name ||
                          "No active subscription"}
                      </div>

                      {billingData.subscription && (
                        <div className="text-xs text-slate-500 mt-1">
                          {billingData.subscription.billingCycle} · Renewal{" "}
                          {billingData.subscription.renewalDate
                            ? new Date(
                                billingData.subscription.renewalDate
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </div>
                      )}
                    </div>

                    {billingData.subscription && (
                      <div className="text-right">
                        <div className="text-xs text-slate-500">
                          Status
                        </div>
                        <div className="text-sm font-bold text-emerald-600 mt-0.5">
                          {billingData.subscription.status}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Choose a plan
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      {billingData.plans.map(
                        (billingPlan) => (
                          <div
                            key={billingPlan.id}
                            className={`border rounded-xl p-4 ${
                              billingData.subscription?.plan?.key ===
                              billingPlan.key
                                ? "border-indigo-300 bg-indigo-50/40"
                                : "border-slate-200"
                            }`}
                          >
                            <div className="text-sm font-bold text-slate-900">
                              {billingPlan.name}
                            </div>

                            <div className="text-xs text-slate-500 mt-1 min-h-[32px]">
                              {billingPlan.tagline}
                            </div>

                            <div className="mt-4">
                              <div className="text-lg font-bold text-slate-950">
                                ₹{Number(
                                  billingPlan.monthlyPrice
                                ).toLocaleString("en-IN")}
                                <span className="text-xs font-medium text-slate-400">
                                  /mo
                                </span>
                              </div>

                              <button
                                type="button"
                                disabled={
                                  Boolean(
                                    paymentProcessing
                                  )
                                }
                                onClick={() =>
                                  startSubscriptionPayment(
                                    billingPlan.key,
                                    "MONTHLY"
                                  )
                                }
                                className="w-full mt-3 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2"
                              >
                                {paymentProcessing ===
                                  `${billingPlan.key}:MONTHLY` && (
                                  <Loader2
                                    size={13}
                                    className="animate-spin"
                                  />
                                )}
                                Pay Monthly
                              </button>

                              {billingPlan.yearlyPrice !==
                                null && (
                                <button
                                  type="button"
                                  disabled={
                                    Boolean(
                                      paymentProcessing
                                    )
                                  }
                                  onClick={() =>
                                    startSubscriptionPayment(
                                      billingPlan.key,
                                      "YEARLY"
                                    )
                                  }
                                  className="w-full mt-2 h-9 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2"
                                >
                                  {paymentProcessing ===
                                    `${billingPlan.key}:YEARLY` && (
                                    <Loader2
                                      size={13}
                                      className="animate-spin"
                                    />
                                  )}
                                  ₹{Number(
                                    billingPlan.yearlyPrice
                                  ).toLocaleString("en-IN")} / year
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarClock
                        size={14}
                        className="text-indigo-600"
                      />
                      <div className="text-sm font-bold text-slate-900">
                        Recent Payments
                      </div>
                    </div>

                    <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                      {billingData.payments.length ? (
                        billingData.payments.map(
                          (payment) => (
                            <div
                              key={payment.id}
                              className="px-4 py-3 border-b border-slate-100 last:border-0 flex items-center justify-between gap-3"
                            >
                              <div>
                                <div className="text-xs font-semibold text-slate-800">
                                  {payment.plan.name} · {payment.billingCycle}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {new Date(
                                    payment.paidAt ||
                                      payment.createdAt
                                  ).toLocaleDateString(
                                    "en-IN"
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs font-bold text-slate-900">
                                  ₹{Number(
                                    payment.amount
                                  ).toLocaleString("en-IN")}
                                </div>
                                <div
                                  className={`text-[10px] font-semibold mt-0.5 ${
                                    payment.status ===
                                    "CAPTURED"
                                      ? "text-emerald-600"
                                      : payment.status ===
                                        "FAILED"
                                      ? "text-rose-600"
                                      : "text-amber-600"
                                  }`}
                                >
                                  {payment.status}
                                </div>
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-500">
                          No payment history yet.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {changePasswordOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-slate-950">
                  Change Password
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  Update the password for {user.email}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setChangePasswordOpen(false)
                }
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
                disabled={passwordSaving}
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={
                submitPasswordChange
              }
              className="p-5 space-y-4"
            >
              {[
                [
                  "currentPassword",
                  "Current Password",
                ],
                [
                  "newPassword",
                  "New Password",
                ],
                [
                  "confirmPassword",
                  "Confirm New Password",
                ],
              ].map(
                ([
                  key,
                  label,
                ]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {label}
                    </label>

                    <div className="relative">
                      <input
                        type={
                          passwordVisibility[
                            key
                          ]
                            ? "text"
                            : "password"
                        }
                        value={
                          passwordForm[
                            key
                          ]
                        }
                        onChange={(
                          event
                        ) =>
                          updatePasswordField(
                            key,
                            event.target.value
                          )
                        }
                        required
                        autoComplete={
                          key ===
                          "currentPassword"
                            ? "current-password"
                            : "new-password"
                        }
                        className="w-full h-10 px-3 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setPasswordVisibility(
                            (
                              current
                            ) => ({
                              ...current,
                              [key]:
                                !current[
                                  key
                                ],
                            })
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {passwordVisibility[
                          key
                        ] ? (
                          <EyeOff
                            size={15}
                          />
                        ) : (
                          <Eye
                            size={15}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                )
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-500 leading-5">
                Password must be at least 8 characters and include uppercase, lowercase and a number.
              </div>

              {passwordError && (
                <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <AlertCircle
                    size={14}
                    className="mt-0.5 flex-shrink-0"
                  />
                  {passwordError}
                </div>
              )}

              {passwordMessage && (
                <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <CheckCircle2
                    size={14}
                    className="mt-0.5 flex-shrink-0"
                  />
                  {passwordMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setChangePasswordOpen(
                      false
                    )
                  }
                  disabled={
                    passwordSaving
                  }
                  className="h-9 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    passwordSaving
                  }
                  className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
                >
                  {passwordSaving && (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  )}

                  {passwordSaving
                    ? "Updating..."
                    : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
