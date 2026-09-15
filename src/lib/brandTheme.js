// Brand theming engine.
// One source of truth for the platform accent colour. Each ramp is stored as
// "R G B" channels so Tailwind's `rgb(var(--brand-N) / <alpha-value>)` keeps
// opacity utilities (e.g. bg-brand-600/50) working.
//
// The Branding picker saves one of these keys as the tenant's primaryColor.
// applyBrandTheme() writes the ramp onto <html>, and because tailwind.config
// maps both `brand-*` and `indigo-*` to these variables, the whole UI re-themes
// live with zero component edits.

export const BRAND_COLORS = [
  { key: "indigo", label: "Indigo", hex: "#4f46e5" },
  { key: "blue", label: "Blue", hex: "#2563eb" },
  { key: "sky", label: "Sky", hex: "#0284c7" },
  { key: "teal", label: "Teal", hex: "#0d9488" },
  { key: "emerald", label: "Emerald", hex: "#059669" },
  { key: "purple", label: "Purple", hex: "#7c3aed" },
];

export const BRAND_RAMPS = {
  indigo: {
    50: "238 242 255", 100: "224 231 255", 200: "199 210 254", 300: "165 180 252",
    400: "129 140 248", 500: "99 102 241", 600: "79 70 229", 700: "67 56 202",
    800: "55 48 163", 900: "49 46 129", 950: "30 27 75",
  },
  blue: {
    50: "239 246 255", 100: "219 234 254", 200: "191 219 254", 300: "147 197 253",
    400: "96 165 250", 500: "59 130 246", 600: "37 99 235", 700: "29 78 216",
    800: "30 64 175", 900: "30 58 138", 950: "23 37 84",
  },
  sky: {
    50: "240 249 255", 100: "224 242 254", 200: "186 230 253", 300: "125 211 252",
    400: "56 189 248", 500: "14 165 233", 600: "2 132 199", 700: "3 105 161",
    800: "7 89 133", 900: "12 74 110", 950: "8 47 73",
  },
  teal: {
    50: "240 253 250", 100: "204 251 241", 200: "153 246 228", 300: "94 234 212",
    400: "45 212 191", 500: "20 184 166", 600: "13 148 136", 700: "15 118 110",
    800: "17 94 89", 900: "19 78 74", 950: "4 47 46",
  },
  emerald: {
    50: "236 253 245", 100: "209 250 229", 200: "167 243 208", 300: "110 231 183",
    400: "52 211 153", 500: "16 185 129", 600: "5 150 105", 700: "4 120 87",
    800: "6 95 70", 900: "6 78 59", 950: "2 44 34",
  },
  purple: {
    50: "250 245 255", 100: "243 232 255", 200: "233 213 255", 300: "216 180 254",
    400: "192 132 252", 500: "168 85 247", 600: "147 51 234", 700: "126 34 206",
    800: "107 33 168", 900: "88 28 135", 950: "59 7 100",
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
    BRAND_COLORS[0].hex
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