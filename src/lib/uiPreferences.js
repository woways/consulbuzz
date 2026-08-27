export const DEFAULT_UI_PREFERENCES = {
  appearance: "light",
  density: "comfortable",
  showGreeting: true,
  showCalendar: true,
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12H",
};

export function readUiPreferences() {
  if (typeof window === "undefined") return DEFAULT_UI_PREFERENCES;
  try {
    const raw = window.localStorage.getItem("cb_ui_preferences");
    return raw ? { ...DEFAULT_UI_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_UI_PREFERENCES;
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
}

function dateLocale(prefs) {
  return prefs.dateFormat === "MM/DD/YYYY" ? "en-US" : "en-GB";
}

function defaultDateOptions(prefs) {
  if (prefs.dateFormat === "DD MMM YYYY") return { day: "2-digit", month: "short", year: "numeric" };
  return { day: "2-digit", month: "2-digit", year: "numeric" };
}

export function formatUiDate(value, options) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const prefs = readUiPreferences();
  return date.toLocaleDateString(dateLocale(prefs), options || defaultDateOptions(prefs));
}

export function formatUiTime(value, options = {}) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const prefs = readUiPreferences();
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", ...options, hour12: prefs.timeFormat !== "24H" });
}

export function formatUiDateTime(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${formatUiDate(date)}, ${formatUiTime(date)}`;
}