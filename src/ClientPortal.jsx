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
  Menu,
  Search,
  Sun,
  ChevronRight,
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
    mobileSidebarOpen,
    setMobileSidebarOpen,
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

  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [contextMenu, setContextMenu] = useState(null);

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
    receiptOpen,
    setReceiptOpen,
  ] = useState(false);

  const [
    receiptData,
    setReceiptData,
  ] = useState(null);

  const [
    receiptLoading,
    setReceiptLoading,
  ] = useState(false);

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

  // Global reporting period shared by all date-based CRM modules.
  const [selectedYear, setSelectedYear] = useState(() =>
    window.localStorage.getItem("cb_global_year") || "all"
  );
  const [availableYears, setAvailableYears] = useState([
    new Date().getFullYear(),
  ]);

  useEffect(() => {
    window.localStorage.setItem("cb_global_year", selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    let active = true;
    async function loadAvailableYears() {
      try {
        const result = await apiRequest("/api/client/analytics/dashboard?year=all");
        if (active && Array.isArray(result.availableYears) && result.availableYears.length) {
          setAvailableYears(result.availableYears);
        }
      } catch (error) {
        console.error("Unable to load reporting years:", error);
      }
    }
    loadAvailableYears();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [module]);

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
                if (verified.receipt) {
                  setReceiptData(
                    verified.receipt
                  );
                  setReceiptOpen(true);
                }

                await loadUnreadNotificationCount();
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

  async function openPaymentReceipt(
    paymentId
  ) {
    setReceiptOpen(true);
    setReceiptLoading(true);

    try {
      const data =
        await apiRequest(
          `/api/client/billing/receipts/${paymentId}`
        );

      setReceiptData(
        data.receipt || null
      );
    } catch (error) {
      setBillingError(
        error?.data?.message ||
          "Unable to load payment receipt"
      );
      setReceiptOpen(false);
    } finally {
      setReceiptLoading(false);
    }
  }

  function printReceipt() {
    const receipt =
      document.getElementById(
        "consulbuzz-payment-receipt"
      );

    if (!receipt) {
      return;
    }

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=900,height=1100"
      );

    if (!printWindow) {
      setBillingError(
        "Please allow pop-ups to print the receipt."
      );
      return;
    }

    printWindow.document.open();

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>ConsulBuzz Payment Receipt</title>

          <script src="https://cdn.tailwindcss.com"></script>

          <style>
            @page {
              size: A4;
              margin: 10mm;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body {
              font-family:
                Inter,
                ui-sans-serif,
                system-ui,
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;
            }

            #consulbuzz-payment-receipt {
              width: 100%;
              max-width: 794px;
              margin: 0 auto;
              box-shadow: none !important;
              border-radius: 0 !important;
            }

            @media print {
              .print\\:hidden {
                display: none !important;
              }
            }
          </style>
        </head>

        <body>
          ${receipt.outerHTML}

          <script>
            window.addEventListener(
              "load",
              function () {
                setTimeout(
                  function () {
                    window.print();
                  },
                  500
                );
              }
            );
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
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
            tenant={tenant}
            user={user}
            selectedYear={selectedYear}
          />
        );

      case "utm-leads":
        return (
          <UTMLeads selectedYear={selectedYear} />
        );

      case "admissions":
        return (
          <Admissions selectedYear={selectedYear} />
        );

      case "revenue":
        return (
          <Revenue selectedYear={selectedYear} />
        );

      case "lead-store":
        return (
          <LeadStore selectedYear={selectedYear} />
        );

      case "walkins":
        return (
          <Walkins selectedYear={selectedYear} />
        );

      case "counselling":
        return (
          <Counselling selectedYear={selectedYear} />
        );

      case "analytics":
        return (
          <Analytics selectedYear={selectedYear} />
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
        className={`relative mx-2 w-[calc(100%-16px)] rounded-xl flex items-center py-2.5 text-[13px] font-semibold transition-all ${
          sidebarCollapsed
            ? "justify-center px-2"
            : "gap-3 px-4"
        } ${
          active
            ? "bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
            : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
        }`}
      >
        {active && (
          <span className="absolute left-1.5 top-2 bottom-2 w-[2px] rounded-full bg-indigo-400" />
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
        className={`relative mx-2 w-[calc(100%-16px)] rounded-lg flex items-center gap-2.5 pl-[42px] pr-3 py-2 text-[12px] transition-all ${
          active
            ? "text-white bg-white/[0.07]"
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


  function getTimeGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 17) {
      return "Good afternoon";
    }

    return "Good evening";
  }

  const timeGreeting = getTimeGreeting();

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900 overflow-x-hidden">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }

          body > * {
            display: none !important;
          }

          #consulbuzz-payment-receipt-print-root {
            display: block !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          #consulbuzz-payment-receipt {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
            break-inside: avoid-page !important;
          }

          #consulbuzz-payment-receipt * {
            visibility: visible !important;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* MOBILE APP BAR */}
      <div className="lg:hidden sticky top-0 z-40 h-14 bg-[#f6f7fb]/95 backdrop-blur-xl border-b border-slate-200/70 px-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm flex items-center justify-center active:scale-95 transition"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0 px-3 text-center">
          <div className="text-[13px] font-bold text-slate-950 truncate">
            {company.brandName}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setMobileSidebarOpen(true);
            setAccountActionsOpen(true);
          }}
          className="relative w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm"
          aria-label="Open account"
        >
          {initials}
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-[#f6f7fb]" />
          )}
        </button>
      </div>

      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px]"
        />
      )}

      <div className="flex">
        {/* FIXED LIGHT SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 lg:z-30 bg-[#071321] transition-[width,transform] duration-300 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } ${
            sidebarCollapsed ? "w-[92px]" : "w-[286px]"
          }`}
        >
          <div className="h-screen flex flex-col overflow-visible">
            {/* CONSULBUZZ PRODUCT IDENTITY — TOP LEFT */}
            {(!sidebarCollapsed || mobileSidebarOpen) ? (
              <div className="px-5 pt-5 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white text-[#071321] flex items-center justify-center text-[10px] font-black tracking-tight shadow-sm">
                    CB
                  </div>

                  <div>
                    <div className="text-[17px] leading-none font-black tracking-[-0.03em] text-white">
                      ConsulBuzz
                    </div>
                    <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      CRM Workspace
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-1 flex justify-center">
                <div
                  className="w-10 h-10 rounded-xl bg-white text-[#071321] flex items-center justify-center text-[10px] font-black tracking-tight shadow-sm"
                  title="ConsulBuzz"
                >
                  CB
                </div>
              </div>
            )}

            {/* MENU CARD */}
            <nav
              className={`relative mx-3 mb-3 flex-1 min-h-0 rounded-[22px] border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)] ${
                sidebarCollapsed && !mobileSidebarOpen
                  ? "px-2 py-4"
                  : "px-2 py-3"
              }`}
            >
              <div className="h-full overflow-y-auto overflow-x-visible pb-3">
                {NAV_GROUPS.map((group) => {
                  const Icon = group.icon;
                  const groupActive = group.items.includes(module);

                  if (group.direct) {
                    const key = group.items[0];
                    const active = module === key;
                    const locked =
                      !enabledFeatures.includes(key) ||
                      !hasModulePermission(key);

                    return (
                      <button
                        key={group.key}
                        type="button"
                        title={sidebarCollapsed ? group.label : undefined}
                        onClick={() => {
                          setContextMenu(null);
                          setModule(key);
                          setMobileSidebarOpen(false);
                        }}
                        className={`relative w-full rounded-2xl mb-1 transition-all ${
                          sidebarCollapsed && !mobileSidebarOpen
                            ? "h-[66px] flex items-center justify-center"
                            : "h-12 px-4 flex items-center gap-3"
                        } ${
                          active
                            ? "bg-indigo-50 text-indigo-800"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-indigo-500" />
                        )}

                        <Icon
                          size={sidebarCollapsed && !mobileSidebarOpen ? 23 : 18}
                          strokeWidth={1.8}
                        />

                        {(!sidebarCollapsed || mobileSidebarOpen) && (
                          <>
                            <span className="flex-1 text-left text-[14px] font-semibold">
                              {group.label}
                            </span>

                            {locked ? (
                              <Lock size={12} className="text-slate-400" />
                            ) : (
                              <ChevronRight size={15} className="text-slate-400" />
                            )}
                          </>
                        )}
                      </button>
                    );
                  }

                  const flyoutOpen = contextMenu === group.key;

                  return (
                    <div key={group.key} className="relative">
                      <button
                        type="button"
                        title={sidebarCollapsed ? group.label : undefined}
                        onClick={() =>
                          setContextMenu((current) =>
                            current === group.key ? null : group.key
                          )
                        }
                        className={`relative w-full rounded-2xl mb-1 transition-all ${
                          sidebarCollapsed && !mobileSidebarOpen
                            ? "h-[66px] flex items-center justify-center"
                            : "h-12 px-4 flex items-center gap-3"
                        } ${
                          groupActive || flyoutOpen
                            ? "bg-indigo-50 text-indigo-800"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {(groupActive || flyoutOpen) && (
                          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-indigo-500" />
                        )}

                        <Icon
                          size={sidebarCollapsed && !mobileSidebarOpen ? 23 : 18}
                          strokeWidth={1.8}
                        />

                        {(!sidebarCollapsed || mobileSidebarOpen) && (
                          <>
                            <span className="flex-1 text-left text-[14px] font-semibold">
                              {group.label}
                            </span>
                            <ChevronRight
                              size={15}
                              className={`text-slate-400 transition-transform ${
                                flyoutOpen ? "rotate-90" : ""
                              }`}
                            />
                          </>
                        )}
                      </button>

                      {flyoutOpen && (
                        <div
                          className={`fixed z-[80] w-[245px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.16)] ${
                            sidebarCollapsed && !mobileSidebarOpen
                              ? "left-[104px]"
                              : "left-[298px]"
                          }`}
                          style={{
                            top: `${Math.min(
                              150 +
                                NAV_GROUPS.findIndex(
                                  (item) => item.key === group.key
                                ) *
                                  52,
                              window.innerHeight - 300
                            )}px`,
                          }}
                        >
                          <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            {group.label}
                          </div>

                          {group.items.map((key) => {
                            const meta = MODULE_META[key];
                            if (!meta) return null;

                            const ChildIcon = meta.icon;
                            const active = module === key;
                            const locked =
                              !enabledFeatures.includes(key) ||
                              !hasModulePermission(key);

                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  setModule(key);
                                  setContextMenu(null);
                                  setMobileSidebarOpen(false);
                                }}
                                className={`w-full h-11 rounded-xl px-3 flex items-center gap-3 text-left transition-colors ${
                                  active
                                    ? "bg-indigo-50 text-indigo-800"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <ChildIcon size={16} strokeWidth={1.8} />
                                <span className="flex-1 text-[13px] font-semibold">
                                  {meta.label}
                                </span>

                                {(key === "walkins" || key === "counselling") && (
                                  <Crown
                                    size={13}
                                    className="text-indigo-500"
                                    title="Premium module"
                                  />
                                )}

                                {locked ? (
                                  <Lock size={11} className="text-slate-400" />
                                ) : (
                                  <ChevronRight size={13} className="text-slate-300" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </nav>

            {/* CURRENT PLAN — bottom of sidebar */}
            <div className={`${sidebarCollapsed && !mobileSidebarOpen ? "px-2" : "px-3"} pb-3`}>
              {(!sidebarCollapsed || mobileSidebarOpen) ? (
                <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center gap-2">
                    <Crown size={14} className="text-indigo-500" />
                    <div className="text-[11px] font-bold text-white">
                      {String(plan || "basic").charAt(0).toUpperCase() +
                        String(plan || "basic").slice(1)} Plan
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-300">
                    Active subscription
                  </div>
                </div>
              ) : (
                <div
                  className="w-11 h-11 mx-auto rounded-xl border border-white/15 bg-white/10 flex items-center justify-center shadow-sm"
                  title={`${String(plan || "basic").charAt(0).toUpperCase() +
                    String(plan || "basic").slice(1)} Plan`}
                >
                  <Crown size={16} className="text-indigo-500" />
                </div>
              )}
            </div>
          </div>

          {/* COLLAPSE — middle edge of sidebar */}
          <button
            type="button"
            onClick={() => {
              setContextMenu(null);
              setSidebarCollapsed((current) => !current);
            }}
            className="hidden lg:flex absolute right-0 top-1/2 z-30 w-9 h-9 translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white text-slate-600 shadow-md items-center justify-center hover:bg-slate-50 hover:text-slate-950"
            title={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
            aria-label={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </button>
        </aside>

        {/* MAIN WORKSPACE */}
        <div
          className={`flex-1 min-w-0 transition-[margin] duration-300 ${
            sidebarCollapsed ? "lg:ml-[92px]" : "lg:ml-[286px]"
          }`}
        >
          {/* TOP BAR */}
          <header className="sticky top-0 z-40 h-[76px] bg-[#fbfaf7]/95 backdrop-blur-xl border-b border-slate-200/80">
            <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center gap-4">
              <div className="relative flex-1 max-w-[560px]">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={workspaceSearch}
                  onChange={(event) => setWorkspaceSearch(event.target.value)}
                  placeholder="Search modules..."
                  className="w-full h-11 pl-12 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                />

                {workspaceSearch.trim() && (
                  <div className="absolute left-0 right-0 top-[50px] z-[90] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                    {NAV_GROUPS.flatMap((group) => group.items)
                      .filter((key) => {
                        const label =
                          key === "dashboard"
                            ? "Dashboard"
                            : key === "settings"
                            ? "Settings"
                            : MODULE_META[key]?.label || key;

                        return label
                          .toLowerCase()
                          .includes(workspaceSearch.trim().toLowerCase());
                      })
                      .slice(0, 8)
                      .map((key) => {
                        const label =
                          key === "dashboard"
                            ? "Dashboard"
                            : key === "settings"
                            ? "Settings"
                            : MODULE_META[key]?.label || key;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setModule(key);
                              setWorkspaceSearch("");
                            }}
                            className="w-full px-3 py-2.5 rounded-lg text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {label}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                {/* GLOBAL PERIOD */}
                <div className="hidden md:flex h-10 items-center rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 border-r border-slate-100">
                    Period
                  </div>

                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    className="h-full min-w-[104px] bg-white px-3 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                    aria-label="Global reporting year"
                  >
                    <option value="all">All Time</option>
                    {availableYears.map((year) => (
                      <option key={year} value={String(year)}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* NOTIFICATIONS */}
                <div ref={notificationRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !notificationsOpen;
                      setNotificationsOpen(next);
                      setProfileMenuOpen(false);

                      if (next) {
                        loadNotifications();
                      }
                    }}
                    className="relative w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50"
                    aria-label="Notifications"
                  >
                    <Bell size={18} />

                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-indigo-600 text-white text-[9px] font-bold leading-[17px] text-center">
                        {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <div className="text-sm font-bold text-slate-950">
                          Notifications
                        </div>

                        {unreadNotificationCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllNotificationsRead}
                            className="text-[11px] font-semibold text-indigo-600"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-[420px] overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="py-10 flex items-center justify-center gap-2 text-xs text-slate-500">
                            <Loader2 size={14} className="animate-spin" />
                            Loading...
                          </div>
                        ) : notificationError ? (
                          <div className="p-4 text-xs text-rose-600">
                            {notificationError}
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="py-10 text-center text-xs text-slate-500">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => markNotificationRead(notification)}
                              className={`w-full px-4 py-3 text-left border-b border-slate-100 last:border-0 hover:bg-slate-50 ${
                                notification.read
                                  ? "bg-white"
                                  : "bg-indigo-50/30"
                              }`}
                            >
                              <div className="text-xs font-bold text-slate-900">
                                {notification.title}
                              </div>

                              <div className="mt-1 text-[11px] leading-5 text-slate-500">
                                {notification.message}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* PROFILE — TOP RIGHT ONLY */}
                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen((current) => !current);
                      setNotificationsOpen(false);
                    }}
                    className="h-11 pl-1 pr-2 sm:pr-3 rounded-xl hover:bg-white flex items-center gap-2.5 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-bold">
                      {initials}
                    </div>

                    <div className="hidden sm:block text-left min-w-0">
                      <div className="text-[13px] font-bold text-slate-950 truncate max-w-[130px]">
                        {user.name || tenant.name}
                      </div>

                      <div className="text-[10px] text-slate-500">
                        {formatRole(user.role)}
                      </div>
                    </div>

                    <ChevronDown
                      size={14}
                      className={`hidden sm:block text-slate-400 transition-transform ${
                        profileMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-[240px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
                      <div className="px-3 py-2.5 border-b border-slate-100">
                        <div className="text-xs font-bold text-slate-900">
                          {user.name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {user.email}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={openChangePassword}
                        className="mt-1 w-full h-10 px-3 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                      >
                        <Lock size={14} />
                        Change Password
                      </button>

                      {(user.role === "CLIENT_ADMIN" ||
                        permissions.canManageBilling === true) && (
                        <button
                          type="button"
                          onClick={openBilling}
                          className="w-full h-10 px-3 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                        >
                          <ReceiptIndianRupee size={14} />
                          Billing & Subscription
                        </button>
                      )}

                      {(user.role === "CLIENT_ADMIN" ||
                        permissions.canManageSettings === true) && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setModule("settings");
                          }}
                          className="w-full h-10 px-3 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                        >
                          <Settings size={14} />
                          Company Settings
                        </button>
                      )}

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        type="button"
                        onClick={signOut}
                        disabled={signingOut}
                        className="w-full h-10 px-3 rounded-xl text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 disabled:opacity-50"
                      >
                        {signingOut ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <LogOut size={14} />
                        )}
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className="px-3 py-4 sm:px-5 sm:py-5 lg:p-7">
            <div className="max-w-[1560px] mx-auto">
              {module === "dashboard" && (
                <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
                  <div className="relative min-h-[138px] px-5 sm:px-7 py-5 flex items-center justify-between gap-6">
                    <div className="relative z-10 min-w-0">
                      <div className="text-[25px] sm:text-[30px] leading-tight font-black tracking-[-0.045em] text-slate-950">
                        {timeGreeting},{" "}
                        <span className="text-indigo-600">
                          {(user?.name || tenant.ownerName || "Admin").split(" ")[0]}
                        </span>
                        <span className="ml-2" aria-hidden="true">🚀</span>
                      </div>

                      <div className="mt-2 text-[12px] sm:text-[13px] text-slate-500">
                        Here&apos;s your ConsulBuzz CRM activity for today.
                      </div>

                      <div className="mt-2 text-[10px] sm:text-[11px] font-medium text-slate-400">
                        {new Date().toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div className="hidden md:flex w-[250px] lg:w-[320px] self-stretch items-center justify-end flex-shrink-0">
                      <svg
                        viewBox="0 0 360 150"
                        className="w-full max-h-[128px]"
                        role="img"
                        aria-label="CRM activity illustration"
                      >
                        <path
                          d="M88 0h272v150H45c20-24 18-48 1-70C28 56 36 22 88 0Z"
                          fill="#eef4ff"
                        />
                        <rect
                          x="78"
                          y="36"
                          width="88"
                          height="62"
                          rx="8"
                          fill="#ffffff"
                          stroke="#0f172a"
                          strokeWidth="3"
                        />
                        <path
                          d="M98 56h47M98 70h36"
                          stroke="#0f172a"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <rect
                          x="64"
                          y="103"
                          width="118"
                          height="9"
                          rx="4.5"
                          fill="#4f46e5"
                        />
                        <path
                          d="M222 36l55 26-40 30-52-26 37-30Z"
                          fill="#4f46e5"
                        />
                        <path
                          d="M222 36l15 56M277 62l-92 4"
                          stroke="#a5b4fc"
                          strokeWidth="2"
                        />
                        <circle
                          cx="280"
                          cy="45"
                          r="16"
                          fill="#111827"
                        />
                        <path
                          d="M268 61c-16 7-25 23-25 48v29h57v-29c0-22-7-39-21-48h-11Z"
                          fill="#111827"
                        />
                        <path
                          d="M249 83l-26-8-5 12 30 15M295 82l21-18"
                          fill="none"
                          stroke="#111827"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M258 137l-8 13M288 137l9 13"
                          stroke="#111827"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        <path
                          d="M207 23l-9-11M219 20l2-14M231 27l10-10"
                          stroke="#4f46e5"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {renderModule()}
            </div>
          </main>
        </div>
      </div>

      {billingOpen && (
        <div className="fixed inset-0 z-[95] bg-slate-950/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-4xl max-h-[94vh] sm:max-h-[90vh] bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
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
                        <div className="text-sm font-bold text-indigo-600 mt-0.5">
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
                                      ? "text-indigo-600"
                                      : payment.status ===
                                        "FAILED"
                                      ? "text-rose-600"
                                      : "text-amber-600"
                                  }`}
                                >
                                  {payment.status}
                                </div>

                                {payment.status === "CAPTURED" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openPaymentReceipt(
                                        payment.id
                                      )
                                    }
                                    className="mt-1.5 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
                                  >
                                    View Receipt
                                  </button>
                                )}
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

      {receiptOpen && (
        <div
          id="consulbuzz-payment-receipt-print-root"
          className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-[3px] p-3 sm:p-6 overflow-y-auto"
        >
          <div className="max-w-[860px] mx-auto">
            <div className="flex items-center justify-between gap-3 mb-3 print:hidden">
              <button
                type="button"
                onClick={() => {
                  setReceiptOpen(false);
                  setReceiptData(null);
                }}
                className="h-9 px-3 rounded-xl border border-white/20 bg-white/10 text-white text-xs font-semibold hover:bg-white/15"
              >
                Close
              </button>

              {receiptData && (
                <button
                  type="button"
                  onClick={printReceipt}
                  className="h-9 px-4 rounded-xl bg-white text-slate-950 text-xs font-semibold shadow-sm"
                >
                  Print / Save PDF
                </button>
              )}
            </div>

            <div
              id="consulbuzz-payment-receipt"
              className="bg-white rounded-[24px] shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:text-[11px]"
            >
              {receiptLoading ? (
                <div className="py-24 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin" />
                  Loading receipt...
                </div>
              ) : receiptData ? (
                <>
                  <div className="px-8 sm:px-10 pt-9 pb-8 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-[#071321] text-white flex items-center justify-center text-[11px] font-black">
                            CB
                          </div>

                          <div>
                            <div className="text-[18px] font-black tracking-[-0.03em] text-slate-950">
                              ConsulBuzz
                            </div>
                            <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] font-semibold text-slate-400">
                              CRM Subscription
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Payment Receipt
                        </div>

                        <div className="mt-2 text-[28px] sm:text-[34px] leading-none font-black tracking-[-0.045em] text-slate-950">
                          ₹{Number(
                            receiptData.amount || 0
                          ).toLocaleString("en-IN")}
                        </div>

                        <div className="mt-2 text-sm font-semibold text-emerald-600">
                          Payment successful
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                          <CheckCircle2 size={12} />
                          Paid
                        </div>

                        <div className="mt-5 text-[10px] text-slate-400">
                          Receipt No.
                        </div>
                        <div className="mt-1 text-xs font-bold text-slate-800 break-all max-w-[220px]">
                          {receiptData.receiptNumber || receiptData.id}
                        </div>

                        <div className="mt-3 text-[10px] text-slate-400">
                          Payment Date
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-700">
                          {new Date(
                            receiptData.paidAt ||
                              receiptData.createdAt
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 sm:px-10 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          Billed To
                        </div>

                        <div className="mt-3 text-sm font-bold text-slate-950">
                          {receiptData.company?.brandName ||
                            receiptData.company?.name ||
                            company.name}
                        </div>

                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          {receiptData.company?.email || company.email || "—"}
                          <br />
                          {receiptData.company?.phone || company.phone || ""}
                          {receiptData.company?.city
                            ? ` · ${receiptData.company.city}`
                            : company.city
                            ? ` · ${company.city}`
                            : ""}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          Subscription
                        </div>

                        <div className="mt-3 text-sm font-bold text-slate-950">
                          {receiptData.plan?.name} Plan
                        </div>

                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          {receiptData.billingCycle} Billing
                          <br />
                          Renewal:{" "}
                          {receiptData.subscription?.renewalDate
                            ? new Date(
                                receiptData.subscription.renewalDate
                              ).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="grid grid-cols-[1fr_auto] bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        <div>Description</div>
                        <div>Amount</div>
                      </div>

                      <div className="grid grid-cols-[1fr_auto] px-4 py-4 border-t border-slate-100">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            ConsulBuzz {receiptData.plan?.name} Plan
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {receiptData.billingCycle === "YEARLY"
                              ? "Annual CRM subscription"
                              : "Monthly CRM subscription"}
                          </div>
                        </div>

                        <div className="text-sm font-bold text-slate-950">
                          ₹{Number(
                            receiptData.amount || 0
                          ).toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Subtotal</span>
                          <span className="font-semibold text-slate-800">
                            ₹{Number(
                              receiptData.amount || 0
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Tax / GST</span>
                          <span className="font-semibold text-slate-500">
                            Not separately recorded
                          </span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-200 flex items-end justify-between gap-3">
                          <span className="text-sm font-bold text-slate-950">
                            Total Paid
                          </span>
                          <span className="text-[22px] font-black tracking-tight text-slate-950">
                            ₹{Number(
                              receiptData.amount || 0
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Payment Details
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        {[
                          ["Payment Method", "Razorpay"],
                          ["Currency", receiptData.currency || "INR"],
                          ["Payment ID", receiptData.providerPaymentId || "—"],
                          ["Order ID", receiptData.providerOrderId || "—"],
                          ["Status", receiptData.status || "CAPTURED"],
                          [
                            "Billing Cycle",
                            receiptData.billingCycle || "—",
                          ],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="border-b border-slate-100 pb-3"
                          >
                            <div className="text-[10px] text-slate-400">
                              {label}
                            </div>
                            <div className="mt-1 text-xs font-semibold text-slate-800 break-all">
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-9 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Thank you for choosing ConsulBuzz.
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          This receipt confirms successful payment for your CRM subscription.
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 sm:text-right">
                        ConsulBuzz CRM
                        <br />
                        Subscription Receipt
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {changePasswordOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
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
                <div className="flex items-start gap-2 text-xs text-indigo-700 bg-indigo-50 border border-emerald-200 rounded-lg p-3">
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
