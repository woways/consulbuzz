// Brand theming engine.
// One source of truth for the platform accent colour. Each ramp is stored as
// "R G B" channels so Tailwind's `rgb(var(--brand-N) / <alpha-value>)` keeps
// opacity utilities (e.g. bg-brand-600/50) working.
//
// The Branding picker saves one of these keys as the tenant's primaryColor.
// applyBrandTheme() writes the ramp onto <html>, and because tailwind.config
// maps both `brand-*` and `indigo-*` to these variables, the whole UI re-themes
// live with zero component edits.

// Curated picker palette: visually distinct, professional colours only.
export const BRAND_COLORS = [
  { key: "indigo", label: "Indigo", hex: "#4f46e5" },
  { key: "blue", label: "Blue", hex: "#2563eb" },
  { key: "teal", label: "Teal", hex: "#0d9488" },
  { key: "emerald", label: "Green", hex: "#16a34a" },
  { key: "purple", label: "Purple", hex: "#7c3aed" },
  { key: "maroon", label: "Maroon", hex: "#9f1239" },
  { key: "orange", label: "Orange", hex: "#c2410c" },
  { key: "slate", label: "Slate", hex: "#334155" },
];

// Expanded professional palette. These are additional swatches only;
// the recommended BRAND_COLORS above stay first and are not duplicated here.
export const BRAND_PALETTE = [
  // Neutrals
  "#000000", "#171717", "#262626", "#404040", "#525252", "#737373", "#a3a3a3", "#d4d4d4", "#e5e5e5", "#f5f5f5",
  // Reds / oranges / yellows
  "#7f1d1d", "#991b1b", "#b91c1c", "#dc2626", "#ef4444", "#f97316", "#fb923c", "#f59e0b", "#facc15", "#fde047",
  "#881337", "#be123c", "#e11d48", "#f43f5e", "#fb7185", "#ea580c", "#fbbf24", "#eab308", "#a16207",
  // Greens / teals / cyans
  "#14532d", "#166534", "#15803d", "#22c55e", "#4ade80", "#365314", "#4d7c0f", "#84cc16", "#a3e635", "#bef264",
  "#134e4a", "#115e59", "#0f766e", "#14b8a6", "#2dd4bf", "#164e63", "#0e7490", "#06b6d4", "#22d3ee", "#67e8f9",
  // Blues / indigos / violets
  "#172554", "#1e3a8a", "#1d4ed8", "#3b82f6", "#60a5fa", "#312e81", "#3730a3", "#4338ca", "#6366f1", "#818cf8",
  "#4c1d95", "#5b21b6", "#6d28d9", "#8b5cf6", "#a78bfa", "#581c87", "#7e22ce", "#9333ea", "#a855f7", "#c084fc",
  // Pinks / magentas / warm browns
  "#701a75", "#86198f", "#a21caf", "#d946ef", "#e879f9", "#831843", "#9d174d", "#be185d", "#ec4899", "#f472b6",
  "#431407", "#7c2d12", "#9a3412", "#b45309", "#92400e", "#78350f", "#713f12", "#854d0e", "#ca8a04", "#d97706",
].filter((hex, index, all) => all.indexOf(hex) === index);


export const BRAND_RAMPS = {
  emerald: {
    50: "240 253 244", 100: "220 252 231", 200: "187 247 208", 300: "134 239 172",
    400: "74 222 128", 500: "34 197 94", 600: "22 163 74", 700: "21 128 61",
    800: "22 101 52", 900: "20 83 45", 950: "5 46 22",
  },
  teal: {
    50: "240 253 250", 100: "204 251 241", 200: "153 246 228", 300: "94 234 212",
    400: "45 212 191", 500: "20 184 166", 600: "13 148 136", 700: "15 118 110",
    800: "17 94 89", 900: "19 78 74", 950: "4 47 46",
  },
  sky: {
    50: "240 249 255", 100: "224 242 254", 200: "186 230 253", 300: "125 211 252",
    400: "56 189 248", 500: "14 165 233", 600: "2 132 199", 700: "3 105 161",
    800: "7 89 133", 900: "12 74 110", 950: "8 47 73",
  },
  blue: {
    50: "239 246 255", 100: "219 234 254", 200: "191 219 254", 300: "147 197 253",
    400: "96 165 250", 500: "59 130 246", 600: "37 99 235", 700: "29 78 216",
    800: "30 64 175", 900: "30 58 138", 950: "23 37 84",
  },
  indigo: {
    50: "238 242 255", 100: "224 231 255", 200: "199 210 254", 300: "165 180 252",
    400: "129 140 248", 500: "99 102 241", 600: "79 70 229", 700: "67 56 202",
    800: "55 48 163", 900: "49 46 129", 950: "30 27 75",
  },
  purple: {
    50: "250 245 255", 100: "243 232 255", 200: "233 213 255", 300: "216 180 254",
    400: "192 132 252", 500: "168 85 247", 600: "147 51 234", 700: "126 34 206",
    800: "107 33 168", 900: "88 28 135", 950: "59 7 100",
  },
  maroon: {
    50: "255 241 242", 100: "255 228 230", 200: "254 205 211", 300: "253 164 175",
    400: "251 113 133", 500: "225 29 72", 600: "159 18 57", 700: "136 19 55",
    800: "116 22 52", 900: "96 24 48", 950: "76 5 25",
  },
  orange: {
    50: "255 247 237", 100: "255 237 213", 200: "254 215 170", 300: "253 186 116",
    400: "251 146 60", 500: "249 115 22", 600: "194 65 12", 700: "154 52 18",
    800: "124 45 18", 900: "101 40 17", 950: "67 20 7",
  },
  slate: {
    50: "248 250 252", 100: "241 245 249", 200: "226 232 240", 300: "203 213 225",
    400: "148 163 184", 500: "100 116 139", 600: "51 65 85", 700: "30 41 59",
    800: "15 23 42", 900: "15 23 42", 950: "2 6 23",
  },
  // Legacy values kept so previously-saved tenants continue to render safely.
  amber: {
    50: "255 251 235", 100: "254 243 199", 200: "253 230 138", 300: "252 211 77",
    400: "251 191 36", 500: "245 158 11", 600: "217 119 6", 700: "180 83 9",
    800: "146 64 14", 900: "120 53 15", 950: "69 26 3",
  },
  rose: {
    50: "255 241 242", 100: "255 228 230", 200: "254 205 211", 300: "253 164 175",
    400: "251 113 133", 500: "244 63 94", 600: "225 29 72", 700: "190 18 60",
    800: "159 18 57", 900: "136 19 55", 950: "76 5 25",
  },
};

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

function normalizeHex(value) {
  const raw = String(value || "").trim();
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw.slice(1).split("").map((char) => char + char).join("")}`.toLowerCase();
  }
  return HEX_PATTERN.test(raw) ? raw.toLowerCase() : null;
}

function hexToRgb(value) {
  const hex = normalizeHex(value);
  if (!hex) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function mixChannel(channel, target, amount) {
  return Math.round(channel + (target - channel) * amount);
}

function mixRgb(rgb, target, amount) {
  return `${mixChannel(rgb.r, target, amount)} ${mixChannel(rgb.g, target, amount)} ${mixChannel(rgb.b, target, amount)}`;
}

function customRamp(value) {
  const rgb = hexToRgb(value);
  if (!rgb) return null;

  // Shade 600 is the exact company color. The remaining shades are generated
  // automatically so existing brand-* / indigo-* utilities keep working.
  return {
    50: mixRgb(rgb, 255, 0.94),
    100: mixRgb(rgb, 255, 0.86),
    200: mixRgb(rgb, 255, 0.72),
    300: mixRgb(rgb, 255, 0.54),
    400: mixRgb(rgb, 255, 0.34),
    500: mixRgb(rgb, 255, 0.16),
    600: `${rgb.r} ${rgb.g} ${rgb.b}`,
    700: mixRgb(rgb, 0, 0.14),
    800: mixRgb(rgb, 0, 0.28),
    900: mixRgb(rgb, 0, 0.42),
    950: mixRgb(rgb, 0, 0.58),
  };
}

export function isCustomBrandColor(value) {
  return Boolean(normalizeHex(value));
}

export function applyBrandTheme(colorValue) {
  if (typeof document === "undefined") return;

  const normalizedHex = normalizeHex(colorValue);
  const ramp =
    BRAND_RAMPS[colorValue] ||
    (normalizedHex ? customRamp(normalizedHex) : null) ||
    BRAND_RAMPS.indigo;

  const root = document.documentElement;
  SHADES.forEach((shade) => {
    root.style.setProperty(`--brand-${shade}`, ramp[shade]);
  });
}

export function brandHex(colorValue) {
  const normalizedHex = normalizeHex(colorValue);
  if (normalizedHex) return normalizedHex;

  return (
    BRAND_COLORS.find((color) => color.key === colorValue)?.hex ||
    BRAND_COLORS.find((color) => color.key === "indigo")?.hex ||
    "#4f46e5"
  );
}

// Read the currently-applied brand shade as a concrete rgb() string.
// For libraries (e.g. Recharts) that need a real colour value, not a CSS var.
// Re-reads on each call, so charts pick up the theme when they render.
export function brandColor(shade = 600) {
  if (typeof document === "undefined") return "#4f46e5";
  const channels = getComputedStyle(document.documentElement)
    .getPropertyValue(`--brand-${shade}`)
    .trim();
  return channels ? `rgb(${channels.replace(/\s+/g, ", ")})` : "#4f46e5";
}