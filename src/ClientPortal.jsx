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
  GraduationCap,
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
  Search,
  Sun,
  ChevronRight,
  Plus,
  Rocket,
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


function SidebarIcon({
  type,
  size = 18,
  className = "",
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  if (type === "home") {
    return (
      <svg {...common}>
        <path d="M3.5 10.5 12 3.5l8.5 7" />
        <path d="M5.5 9.5V20h13V9.5" />
        <path d="M9.5 20v-6h5v6" />
      </svg>
    );
  }

  if (type === "utm") {
    return (
      <svg {...common}>
        <circle cx="6" cy="6" r="2.2" />
        <circle cx="18" cy="6" r="2.2" />
        <circle cx="12" cy="18" r="2.2" />
        <path d="M8 7.4 10.7 15" />
        <path d="M16 7.4 13.3 15" />
        <path d="M8.3 6h7.4" />
      </svg>
    );
  }

  if (type === "store") {
    return (
      <svg {...common}>
        <path d="M5 8.5h14l-1.1 10H6.1L5 8.5Z" />
        <path d="M8.5 8.5V6.5a3.5 3.5 0 0 1 7 0v2" />
        <path d="M9.5 12h5" />
      </svg>
    );
  }

  if (type === "admissions") {
    return (
      <svg {...common}>
        <path d="m3 9 9-4 9 4-9 4-9-4Z" />
        <path d="M7 11.5V15c0 1.5 2.2 2.8 5 2.8s5-1.3 5-2.8v-3.5" />
        <path d="M21 9v5" />
      </svg>
    );
  }

  if (type === "finance") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9 7.5h6" />
        <path d="M9 10.5h5.2" />
        <path d="M9.2 7.5c0 3 1.7 4.5 4.8 4.5" />
        <path d="m10 12 5 5" />
      </svg>
    );
  }

  if (type === "insights") {
    return (
      <svg {...common}>
        <path d="M4 19V10" />
        <path d="M10 19V6" />
        <path d="M16 19v-8" />
        <path d="M22 19V4" />
      </svg>
    );
  }

  if (type === "help") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9.8 9.2a2.6 2.6 0 1 1 4.2 2c-.9.7-2 1.2-2 2.6" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (type === "settings") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.3 15.2a1.8 1.8 0 0 0 .4 2l.1.1-2.5 2.5-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.7v.1h-4.2V21a1.8 1.8 0 0 0-1.1-1.7 1.8 1.8 0 0 0-2 .4l-.1.1-2.5-2.5.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 3 14.1H2.9V10H3a1.8 1.8 0 0 0 1.7-1.1 1.8 1.8 0 0 0-.4-2l-.1-.1 2.5-2.5.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 9.9 3v-.1h4.2V3a1.8 1.8 0 0 0 1.1 1.7 1.8 1.8 0 0 0 2-.4l.1-.1 2.5 2.5-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.7 1.1h.1V14H21a1.8 1.8 0 0 0-1.7 1.2Z" />
      </svg>
    );
  }

  return null;
}

const NAV_GROUPS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: (props) => <SidebarIcon type="home" {...props} />,
    items: ["dashboard"],
    direct: true,
  },

  {
    key: "utm-leads",
    label: "UTM Leads",
    icon: (props) => <SidebarIcon type="utm" {...props} />,
    items: ["utm-leads"],
    direct: true,
  },

  {
    key: "lead-store",
    label: "Lead Store",
    icon: (props) => <SidebarIcon type="store" {...props} />,
    items: ["lead-store"],
    direct: true,
  },

  {
    key: "admissions",
    label: "Admissions",
    icon: (props) => <SidebarIcon type="admissions" {...props} />,
    items: [
      "admissions",
      "walkins",
      "counselling",
    ],
  },

  {
    key: "finance",
    label: "Finance",
    icon: (props) => <SidebarIcon type="finance" {...props} />,
    items: ["revenue"],
  },

  {
    key: "insights",
    label: "Insights",
    icon: (props) => <SidebarIcon type="insights" {...props} />,
    items: ["analytics"],
  },

  {
    key: "help",
    label: "Help & Support",
    icon: (props) => <SidebarIcon type="help" {...props} />,
    items: ["help"],
    direct: true,
  },

  {
    key: "settings",
    label: "Settings",
    icon: (props) => <SidebarIcon type="settings" {...props} />,
    items: ["settings"],
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
    sidebarHoverExpanded,
    setSidebarHoverExpanded,
  ] = useState(false);

  const sidebarHoverTimerRef = useRef(null);

  const openSidebarHover = () => {
    if (!sidebarCollapsed || mobileSidebarOpen) return;

    if (sidebarHoverTimerRef.current) {
      window.clearTimeout(sidebarHoverTimerRef.current);
      sidebarHoverTimerRef.current = null;
    }

    setSidebarHoverExpanded(true);
  };

  const closeSidebarHover = () => {
    if (!sidebarCollapsed || mobileSidebarOpen) return;

    if (sidebarHoverTimerRef.current) {
      window.clearTimeout(sidebarHoverTimerRef.current);
    }

    sidebarHoverTimerRef.current = window.setTimeout(() => {
      setSidebarHoverExpanded(false);
      sidebarHoverTimerRef.current = null;
    }, 90);
  };

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
    billingCycleView,
    setBillingCycleView,
  ] = useState("MONTHLY");
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

  // Global CRM year workspace shared by all operational modules.
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = window.localStorage.getItem("cb_global_year");
    return saved || String(new Date().getFullYear());
  });
  const [availableYears, setAvailableYears] = useState([currentYear]);
  const [addYearOpen, setAddYearOpen] = useState(false);
  const [newWorkspaceYear, setNewWorkspaceYear] = useState("");
  const [yearMode, setYearMode] = useState("EMPTY");
  const [yearSaving, setYearSaving] = useState(false);
  const [yearError, setYearError] = useState("");

  useEffect(() => {
    window.localStorage.setItem("cb_global_year", selectedYear);
  }, [selectedYear]);

  async function loadAvailableYears() {
    try {
      const result = await apiRequest("/api/client/years");
      const years = Array.isArray(result.years) ? result.years.map((x) => Number(x.year)).filter(Number.isFinite) : [];
      const next = Array.from(new Set([currentYear, ...years])).sort((a,b) => b-a);
      setAvailableYears(next);
      if (
        selectedYear !== "all" &&
        !next.includes(Number(selectedYear))
      ) {
        setSelectedYear(
          String(next[0] || currentYear)
        );
      }
    } catch (error) {
      console.error("Unable to load CRM workspace years:", error);
    }
  }

  useEffect(() => { loadAvailableYears(); }, []);

  async function createYearWorkspace(event) {
    event.preventDefault();
    setYearError("");
    const year = Number(newWorkspaceYear);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) { setYearError("Enter a valid year between 2000 and 2100."); return; }
    if (availableYears.includes(year)) { setYearError(`${year} workspace already exists.`); return; }
    setYearSaving(true);
    try {
      await apiRequest("/api/client/years", {
        method: "POST",
        body: JSON.stringify({
          year,
          mode: yearMode,
          copiedFromYear:
            yearMode === "COPY_STRUCTURE"
              ? selectedYear === "all"
                ? currentYear
                : Number(selectedYear)
              : null,
        }),
      });
      await loadAvailableYears();
      setSelectedYear(String(year));
      setAddYearOpen(false);
      setNewWorkspaceYear("");
      setYearMode("EMPTY");
      setModule("dashboard");
    } catch (error) { setYearError(error?.data?.message || "Unable to create year workspace"); }
    finally { setYearSaving(false); }
  }

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

  const planLabel =
    String(
      plan || "basic"
    )
      .charAt(0)
      .toUpperCase() +
    String(
      plan || "basic"
    ).slice(1);

  const sidebarRenewalDate =
    company?.subscription
      ?.renewalDate ||
    billingData?.subscription
      ?.renewalDate ||
    null;

  const sidebarRenewalLabel =
    sidebarRenewalDate
      ? new Date(
          sidebarRenewalDate
        ).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        )
      : null;

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
        className={`relative mx-2 w-[calc(100%-16px)] rounded-xl flex items-center py-2.5 text-[13px] font-semibold transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
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
        className={`relative mx-2 w-[calc(100%-16px)] rounded-lg flex items-center gap-2.5 pl-[42px] pr-3 py-2 text-[12px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
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

  const annualSavingsPercent = (() => {
    const percentages = (billingData.plans || [])
      .map((billingPlan) => {
        const monthly = Number(billingPlan.monthlyPrice || 0);
        const yearly = Number(billingPlan.yearlyPrice || 0);

        if (!monthly || !yearly) return 0;

        const regularYearly = monthly * 12;
        if (yearly >= regularYearly) return 0;

        return Math.round(
          ((regularYearly - yearly) / regularYearly) * 100
        );
      })
      .filter((value) => value > 0);

    return percentages.length
      ? Math.max(...percentages)
      : 0;
  })();

  const sidebarCompact =
    sidebarCollapsed &&
    !sidebarHoverExpanded &&
    !mobileSidebarOpen;

  return (
    <div className="min-h-screen bg-[#f6f7fa] text-slate-900 overflow-x-hidden">
      <style>{`
        html,
        body,
        #root {
          margin: 0;
          min-height: 100%;
          background: #f6f7fa;
        }

        .sidebar-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .sidebar-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

      `}</style>
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
          onMouseEnter={openSidebarHover}
          onMouseLeave={closeSidebarHover}
          className={`fixed inset-y-0 left-0 z-[70] overflow-visible border-r border-white/[0.06] bg-[#07111d] transition-[width,transform,box-shadow] duration-200 ease-out ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } ${
            sidebarCompact
              ? "w-[72px] shadow-[5px_0_18px_rgba(2,8,23,0.08)]"
              : sidebarCollapsed
              ? "w-[252px] shadow-[16px_0_40px_rgba(2,8,23,0.28)]"
              : "w-[252px] shadow-[8px_0_28px_rgba(2,8,23,0.10)]"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setSidebarHoverExpanded(false);
              setSidebarCollapsed((current) => !current);
            }}
            title={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
            aria-label={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
            className="hidden lg:flex absolute top-1/2 right-[-14px] z-[80] h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_5px_16px_rgba(15,23,42,0.18)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-indigo-300 hover:text-indigo-600 hover:shadow-[0_7px_20px_rgba(15,23,42,0.22)]"
          >
            {sidebarCollapsed ? (
              <ChevronRight size={15} strokeWidth={2.2} />
            ) : (
              <PanelLeftClose size={15} strokeWidth={2.2} />
            )}
          </button>

          <div className="h-full flex flex-col overflow-visible">
            {/* CONSULBUZZ PRODUCT IDENTITY — TOP LEFT */}
            {!sidebarCompact ? (
              <div className="px-5 pt-4 pb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-indigo-300/20 bg-gradient-to-br from-[#3b82f6] via-[#4f46e5] to-[#7c3aed] text-[11px] font-black tracking-tight text-white shadow-[0_8px_22px_rgba(79,70,229,0.28)]">
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.35),transparent_42%)]" />
                    <span className="relative">CB</span>
                  </div>

                  <div className="min-w-0 overflow-visible">
                    <div className="whitespace-nowrap text-[17px] font-black leading-none tracking-[-0.03em] text-white">
                      Consul<span className="text-[#4f8cff]">Buzz</span>
                    </div>
                    <div className="mt-1 whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.20em] text-slate-500">
                      CRM Made Simple
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-2 flex justify-center">
                <div
                  className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[10px] border border-indigo-300/20 bg-gradient-to-br from-[#3b82f6] via-[#4f46e5] to-[#7c3aed] text-[11px] font-black tracking-tight text-white shadow-[0_8px_22px_rgba(79,70,229,0.24)]"
                  title="ConsulBuzz"
                >
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.35),transparent_42%)]" />
                  <span className="relative">CB</span>
                </div>
              </div>
            )}

            {/* MENU — integrated dark navigation */}
            <nav
              className={`relative mx-2 mb-3 flex-1 min-h-0 overflow-hidden ${
                sidebarCompact
                  ? "px-1.5 py-2"
                  : "px-2 py-2"
              }`}
            >
              <div className="sidebar-scroll h-full overflow-y-auto overflow-x-hidden pr-0.5">
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
                        title={sidebarCompact ? group.label : undefined}
                        onClick={() => {
                          setModule(key);
                          setMobileSidebarOpen(false);
                        }}
                        className={`relative mb-1 w-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                          sidebarCompact
                            ? "h-11 rounded-lg flex items-center justify-center"
                            : "h-11 rounded-lg px-3 flex items-center gap-3"
                        } ${
                          active
                            ? "bg-gradient-to-r from-[#3457eb] to-[#4f46e5] text-white shadow-[0_8px_18px_rgba(79,70,229,0.20)] ring-1 ring-inset ring-indigo-400/15"
                            : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-indigo-400" />
                        )}

                        <Icon
                          size={sidebarCompact ? 20 : 18}
                          strokeWidth={2}
                          className={active ? "text-white" : "text-slate-400"}
                        />

                        {!sidebarCompact && (
                          <>
                            <span className="flex-1 text-left text-[13px] font-semibold">
                              {group.label}
                            </span>

                            {locked ? (
                              <Lock size={11} className="text-slate-400" />
                            ) : null}
                          </>
                        )}
                      </button>
                    );
                  }

                  const open = Boolean(openGroups[group.key]);

                  if (sidebarCompact) {
                    return (
                      <div key={group.key} className="mb-1">
                        <button
                          type="button"
                          title={group.label}
                          onClick={() =>
                            setOpenGroups((current) => ({
                              ...current,
                              [group.key]: !current[group.key],
                            }))
                          }
                          className={`relative h-11 w-full rounded-lg flex items-center justify-center transition-all duration-300 ${
                            groupActive
                              ? "bg-white/10 text-white"
                              : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          {groupActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-indigo-400" />
                          )}
                          <Icon size={20} strokeWidth={2} />
                        </button>

                        {open && (
                          <div className="mt-1 space-y-1">
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
                                  title={meta.label}
                                  onClick={() => setModule(key)}
                                  className={`relative mx-auto flex h-9 w-10 items-center justify-center rounded-lg transition-all duration-200 ${
                                    active
                                      ? "bg-indigo-500/20 text-indigo-200"
                                      : "text-slate-500 hover:bg-white/[0.06] hover:text-white"
                                  }`}
                                >
                                  {active && (
                                    <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-indigo-400" />
                                  )}
                                  <ChildIcon size={15} strokeWidth={1.9} />

                                  {(key === "walkins" || key === "counselling") && (
                                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                                  )}

                                  {locked && (
                                    <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-slate-500" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={group.key}
                      className="mb-1"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleGroup(group.key)
                        }
                        className={`relative h-11 w-full rounded-lg px-3 flex items-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                          groupActive
                            ? "bg-white/[0.08] text-white"
                            : open
                            ? "bg-white/[0.04] text-white"
                            : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        {groupActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-indigo-400" />
                        )}

                        <Icon
                          size={18}
                          strokeWidth={2}
                          className={
                            groupActive
                              ? "text-white"
                              : "text-slate-400"
                          }
                        />

                        <span className="flex-1 text-left text-[13px] font-semibold">
                          {group.label}
                        </span>

                        <ChevronDown
                          size={14}
                          className={`text-slate-500 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                            open ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <div
                        className={`grid transition-[grid-template-rows,opacity] duration-200 ${
                          open
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="relative ml-[18px] mt-1 mb-1 pl-4">
                            <span className="absolute left-0 top-1 bottom-1 w-px bg-white/10" />

                            <div className="space-y-0.5">
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
                                      setMobileSidebarOpen(false);
                                    }}
                                    className={`relative w-full min-h-9 rounded-lg px-2.5 py-2 flex items-center gap-2.5 text-left transition-colors ${
                                      active
                                        ? "text-white"
                                        : "text-slate-400 hover:text-white"
                                    }`}
                                  >
                                    <ChildIcon
                                      size={14}
                                      strokeWidth={1.8}
                                      className={
                                        active
                                          ? "text-white"
                                          : "text-slate-500"
                                      }
                                    />

                                    <span className="flex-1 text-[12px] font-semibold">
                                      {meta.label}
                                    </span>

                                    {(key === "walkins" || key === "counselling") && (
                                      <Crown
                                        size={12}
                                        className="text-amber-500"
                                        title="Premium module"
                                      />
                                    )}

                                    {locked ? (
                                      <Lock
                                        size={10}
                                        className="text-slate-400"
                                      />
                                    ) : null}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </nav>

            {/* CURRENT PLAN — exact approved sidebar style */}
            <div
              className={`${
                sidebarCompact
                  ? "px-2"
                  : "px-3"
              } pb-3`}
            >
              {!sidebarCompact ? (
                <div className="rounded-[12px] border border-white/10 bg-white/[0.045] px-4 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] font-medium text-slate-300">
                      Current Plan
                    </div>

                    <Crown
                      size={16}
                      strokeWidth={2}
                      className="text-amber-400"
                    />
                  </div>

                  <div className="mt-2 text-[18px] font-bold leading-none text-white">
                    {planLabel}
                  </div>

                  <div className="mt-2 text-[11px] text-slate-300">
                    {sidebarRenewalLabel
                      ? `Valid till ${sidebarRenewalLabel}`
                      : "Active subscription"}
                  </div>

                  <button
                    type="button"
                    onClick={openBilling}
                    className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#2563eb] via-[#4f46e5] to-[#7c3aed] px-3 text-[11px] font-bold text-white shadow-[0_8px_22px_rgba(79,70,229,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(79,70,229,0.30)]"
                  >
                    <Rocket size={14} strokeWidth={2.2} />
                    Upgrade your plan
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openBilling}
                  className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] via-[#4f46e5] to-[#7c3aed] text-white shadow-[0_8px_20px_rgba(79,70,229,0.26)] transition-all duration-300 hover:scale-[1.04]"
                  title="Upgrade your plan"
                >
                  <Rocket size={17} strokeWidth={2.2} />
                </button>
              )}
            </div>
          </div>

        </aside>

        {/* MAIN WORKSPACE */}
        <div
          className={`flex-1 min-w-0 bg-[#f6f7fa] transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[252px]"
          }`}
        >
          {/* TOP BAR — continuous with sidebar */}
          <header
            className={`fixed top-0 right-0 z-40 h-[68px] border-b border-slate-200/80 bg-white/95 text-slate-900 backdrop-blur-xl transition-[left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              sidebarCollapsed
                ? "left-[72px]"
                : "left-[252px]"
            }`}
          >
            <div className="h-full px-4 sm:px-6 lg:px-7 flex items-center gap-4">
              

              <div className="relative flex-1 max-w-[570px]">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={workspaceSearch}
                  onChange={(event) => setWorkspaceSearch(event.target.value)}
                  placeholder="Search leads, admissions, modules..."
                  className="w-full h-10 pl-11 pr-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
                <div className="hidden md:flex h-9 items-center rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 border-r border-slate-200">
                    Period
                  </div>

                  <select
                    value={selectedYear}
                    onChange={(event) => {
                      if (event.target.value === "__add_year__") { setYearError(""); setNewWorkspaceYear(""); setAddYearOpen(true); return; }
                      setSelectedYear(event.target.value);
                      setModule("dashboard");
                    }}
                    className="h-full min-w-[108px] bg-transparent px-3 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                    aria-label="Global CRM workspace year"
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={String(year)}>{year}</option>
                    ))}
                    <option value="all">All Time</option>
                    <option value="__add_year__">+ Add Year</option>
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
                    className="relative w-9 h-9 rounded-lg text-slate-600 flex items-center justify-center hover:bg-slate-100 hover:text-slate-950"
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
                    className="h-10 pl-1 pr-2 sm:pr-3 rounded-lg hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white/10">
                      {initials}
                    </div>

                    <div className="hidden sm:block text-left min-w-0">
                      <div className="text-[13px] font-bold text-slate-900 truncate max-w-[130px]">
                        {user.name || tenant.name}
                      </div>

                      <div className="text-[10px] text-slate-400">
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
          <main className="mt-[68px] min-h-[calc(100vh-68px)] bg-[#f6f7fa] px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
            <div className="max-w-[1560px] mx-auto">
{renderModule()}
            </div>
          </main>
        </div>
      </div>

      {billingOpen && (
        <div className="fixed inset-0 z-[95] bg-slate-950/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-5xl max-h-[94vh] sm:max-h-[90vh] bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-slate-950">
                  Billing & Subscription
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  Review plans, billing cycles and upgrade options for {company.name}.
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
                    <div>
                      <div className="flex justify-center">
                        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => setBillingCycleView("MONTHLY")}
                            className={`h-10 min-w-[112px] rounded-lg px-5 text-xs font-bold transition-all ${
                              billingCycleView === "MONTHLY"
                                ? "bg-white text-slate-950 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Monthly
                          </button>

                          <button
                            type="button"
                            onClick={() => setBillingCycleView("YEARLY")}
                            className={`relative h-10 min-w-[132px] rounded-lg px-5 text-xs font-bold transition-all ${
                              billingCycleView === "YEARLY"
                                ? "bg-white text-slate-950 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Annually
                            {annualSavingsPercent > 0 && (
                              <span className="absolute -right-2 -top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-white shadow-sm">
                                Save up to {annualSavingsPercent}%
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-500">
                          Upgrade Workspace
                        </div>
                        <div className="mt-1 text-[20px] font-bold tracking-[-0.025em] text-slate-950">
                          Choose the plan that fits your team
                        </div>
                        <div className="mx-auto mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                          Switch plans without changing your existing CRM data or workspace setup.
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-3">
                      {billingData.plans.map((billingPlan) => {
                        const isCurrent =
                          billingData.subscription?.plan?.key === billingPlan.key;

                        const isPopular =
                          String(billingPlan.key || "").toLowerCase() === "pro";

                        const yearlyAvailable =
                          billingPlan.yearlyPrice !== null &&
                          billingPlan.yearlyPrice !== undefined;

                        const selectedPrice =
                          billingCycleView === "YEARLY" && yearlyAvailable
                            ? Number(billingPlan.yearlyPrice || 0)
                            : Number(billingPlan.monthlyPrice || 0);

                        const priceSuffix =
                          billingCycleView === "YEARLY" && yearlyAvailable
                            ? "/year"
                            : "/month";

                        const planDescriptions = {
                          basic:
                            "Essential CRM tools for teams getting started.",
                          pro:
                            "More automation and operational tools for growing teams.",
                          advanced:
                            "Complete CRM capabilities for larger and more complex operations.",
                        };

                        const description =
                          planDescriptions[
                            String(billingPlan.key || "").toLowerCase()
                          ] ||
                          billingPlan.tagline ||
                          "Flexible CRM tools for your business.";

                        const featureMap = {
                          basic: [
                            "Core lead management",
                            "Admissions workspace",
                            "Revenue tracking",
                            "In-app notifications",
                            "Standard support",
                          ],
                          pro: [
                            "Everything in Basic",
                            "Walk-ins & Counselling",
                            "Advanced analytics",
                            "Expanded team workflows",
                            "Priority support",
                          ],
                          advanced: [
                            "Everything in Pro",
                            "Advanced customization access",
                            "Extended operational controls",
                            "Premium CRM modules",
                            "Customization request support",
                          ],
                        };

                        const features =
                          featureMap[
                            String(billingPlan.key || "").toLowerCase()
                          ] || [];

                        return (
                          <div
                            key={billingPlan.id}
                            className={`relative flex min-h-[390px] flex-col rounded-2xl border p-5 transition-all duration-300 ${
                              isPopular
                                ? "border-indigo-300 bg-gradient-to-b from-indigo-50/70 to-white shadow-[0_14px_40px_rgba(79,70,229,0.10)]"
                                : isCurrent
                                ? "border-slate-300 bg-slate-50/70"
                                : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.07)]"
                            }`}
                          >
                            {isPopular && (
                              <div className="absolute -top-3 left-5 rounded-full bg-indigo-600 px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-white shadow-sm">
                                Most Popular
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-[17px] font-bold text-slate-950">
                                  {billingPlan.name}
                                </div>

                                <div className="mt-2 min-h-[42px] text-xs leading-5 text-slate-500">
                                  {description}
                                </div>
                              </div>

                              {isCurrent && (
                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                                  Current
                                </span>
                              )}
                            </div>

                            <div className="mt-5">
                              <div className="flex items-end gap-1.5">
                                <div className="text-[27px] font-black tracking-[-0.04em] text-slate-950">
                                  ₹{selectedPrice.toLocaleString("en-IN")}
                                </div>

                                <div className="pb-1 text-[11px] font-medium text-slate-400">
                                  {priceSuffix}
                                </div>
                              </div>

                              {billingCycleView === "YEARLY" &&
                                yearlyAvailable &&
                                Number(billingPlan.monthlyPrice || 0) > 0 && (
                                  <div className="mt-1 text-[10px] font-medium text-emerald-700">
                                    Equivalent to ₹
                                    {Math.round(
                                      Number(billingPlan.yearlyPrice || 0) / 12
                                    ).toLocaleString("en-IN")}
                                    /month
                                  </div>
                                )}
                            </div>

                            <div className="my-5 h-px bg-slate-100" />

                            <div className="space-y-3">
                              {features.map((feature) => (
                                <div
                                  key={feature}
                                  className="flex items-start gap-2.5 text-xs leading-5 text-slate-600"
                                >
                                  <CheckCircle2
                                    size={14}
                                    className="mt-0.5 flex-shrink-0 text-indigo-600"
                                  />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>

                            <div className="mt-auto pt-6">
                              {isCurrent ? (
                                <button
                                  type="button"
                                  disabled
                                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-500"
                                >
                                  Current Plan
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={
                                    Boolean(paymentProcessing) ||
                                    (billingCycleView === "YEARLY" &&
                                      !yearlyAvailable)
                                  }
                                  onClick={() =>
                                    startSubscriptionPayment(
                                      billingPlan.key,
                                      billingCycleView
                                    )
                                  }
                                  className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                                    isPopular
                                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_8px_20px_rgba(79,70,229,0.16)]"
                                      : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                                  }`}
                                >
                                  {paymentProcessing ===
                                    `${billingPlan.key}:${billingCycleView}` && (
                                    <Loader2
                                      size={13}
                                      className="animate-spin"
                                    />
                                  )}

                                  {billingCycleView === "YEARLY" &&
                                  !yearlyAvailable
                                    ? "Annual plan unavailable"
                                    : `Upgrade to ${billingPlan.name}`}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[11px] leading-5 text-slate-500">
                      Your existing CRM records remain unchanged when you upgrade. New plan capabilities become available after successful payment verification.
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

      {addYearOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <form onSubmit={createYearWorkspace} className="w-full max-w-lg overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">CRM Year Workspace</div><h2 className="mt-1 text-xl font-bold text-slate-950">Add Year</h2><p className="mt-1 text-xs leading-5 text-slate-500">Create a fresh historical workspace. Existing {selectedYear} data stays untouched.</p></div>
              <button type="button" onClick={() => setAddYearOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"><X size={17}/></button>
            </div>
            <div className="space-y-5 px-6 py-5">
              <div><label className="mb-1.5 block text-xs font-bold text-slate-700">Year</label><input type="number" min="2000" max="2100" value={newWorkspaceYear} onChange={(e)=>setNewWorkspaceYear(e.target.value)} placeholder="Example: 2025" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-indigo-400" autoFocus/></div>
              <div><div className="mb-2 text-xs font-bold text-slate-700">How should this year start?</div><div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={()=>setYearMode("EMPTY")} className={`rounded-2xl border p-4 text-left ${yearMode === "EMPTY" ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200"}`}><div className="text-sm font-bold">Start Empty</div><div className="mt-1 text-[11px] leading-5 text-slate-500">Yearly leads, admissions, revenue and activity start empty.</div></button>
                <button type="button" onClick={()=>setYearMode("COPY_STRUCTURE")} className={`rounded-2xl border p-4 text-left ${yearMode === "COPY_STRUCTURE" ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200"}`}><div className="text-sm font-bold">Use Current Setup</div><div className="mt-1 text-[11px] leading-5 text-slate-500">Keep company setup and admission structure, but no yearly records.</div></button>
              </div></div>
              {yearError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">{yearError}</div>}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4"><button type="button" onClick={()=>setAddYearOpen(false)} disabled={yearSaving} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold">Cancel</button><button type="submit" disabled={yearSaving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white disabled:opacity-50">{yearSaving ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>} {yearSaving ? "Creating..." : "Create & Open Year"}</button></div>
          </form>
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
