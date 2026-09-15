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

export function applyBrandTheme(colorKey) {
  if (typeof document === "undefined") return;
  const ramp = BRAND_RAMPS[colorKey] || BRAND_RAMPS.indigo;
  const root = document.documentElement;
  SHADES.forEach((shade) => {
    root.style.setProperty(`--brand-${shade}`, ramp[shade]);
  });
}

export function brandHex(colorKey) {
  return (
    BRAND_COLORS.find((color) => color.key === colorKey)?.hex ||
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