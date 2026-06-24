/**
 * Brand-Aware Theme Tokens System - Proforma360
 * Curated color and design system tokens for Corporate, Minimal, and Modern document templates.
 * Translates HEX tokens safely into browser CSS styles and pdf-lib color primitives.
 */

export interface TemplateTheme {
  id: string;
  name: string;

  // Primary branding colors
  primary: string;        // Hex code (e.g., "#0f172a")
  primarySoft: string;    // Hex code (e.g., "#f8fafc")
  
  // Accents
  accent: string;         // Hex code
  accentSoft: string;     // Hex code

  // Typography colors
  heading: string;        // Color for header/critical text
  text: string;           // Color for body text
  muted: string;          // Color for secondary/muted text

  // Surfaces & Borders
  border: string;         // Base border color
  surface: string;        // Main surface background (usually #ffffff)
  cardSurface: string;    // Card elements (client info / details card bg)

  // Structural & Layout detail colors
  divider: string;              // Color for horizontal dividers
  accentLine: string;           // Color for top accent visual authority line
  tableHeader: string;          // Background for table header row
  tableRowHover: string;        // Hover color for table rows
  metadataBackground: string;   // Background for metadata box
  totalsBackground: string;     // Background for totals summary box
  summaryHighlight: string;     // Highlight color for total final
  badgeBackground: string;      // Background for expiring/status badges
}

export const TEMPLATE_THEMES: TemplateTheme[] = [
  {
    id: "default-slate",
    name: "Default Blue (Corporate Slate)",
    primary: "#0f172a",         // Slate 900
    primarySoft: "#f8fafc",     // Slate 50
    accent: "#2563eb",          // Blue 600
    accentSoft: "#dbeafe",      // Blue 100
    heading: "#0f172a",
    text: "#334155",            // Slate 700
    muted: "#64748b",           // Slate 500
    border: "#e2e8f0",          // Slate 200
    surface: "#ffffff",
    cardSurface: "#f8fafc",
    divider: "#f1f5f9",         // Slate 100
    accentLine: "#0f172a",
    tableHeader: "#f8fafc",
    tableRowHover: "#fafafa",
    metadataBackground: "#f8fafc",
    totalsBackground: "#f8fafc",
    summaryHighlight: "#0f172a",
    badgeBackground: "#f1f5f9"
  },
  {
    id: "teal-notion",
    name: "Teal Notion (SaaS Clean)",
    primary: "#0f766e",         // Teal 700
    primarySoft: "#f0fdfa",     // Teal 50
    accent: "#0d9488",          // Teal 600
    accentSoft: "#ccfbf1",      // Teal 100
    heading: "#0f172a",
    text: "#334155",
    muted: "#64748b",
    border: "#e2e8f0",
    surface: "#ffffff",
    cardSurface: "#fbfbfb",
    divider: "#f1f5f9",
    accentLine: "#0f766e",
    tableHeader: "#f8fafc",
    tableRowHover: "#f5fdfb",
    metadataBackground: "#f0fdfa",
    totalsBackground: "#f8fafc",
    summaryHighlight: "#0f766e",
    badgeBackground: "#ccfbf1"
  },
  {
    id: "charcoal-obsidian",
    name: "Charcoal Obsidian (Tech Minimal)",
    primary: "#1c1917",         // Stone 900
    primarySoft: "#fafaf9",     // Stone 50
    accent: "#44403c",          // Stone 700
    accentSoft: "#f5f5f4",      // Stone 100
    heading: "#1c1917",
    text: "#44403c",            // Stone 700
    muted: "#78716c",           // Stone 500
    border: "#e7e5e4",          // Stone 200
    surface: "#ffffff",
    cardSurface: "#fafaf9",
    divider: "#f5f5f4",
    accentLine: "#1c1917",
    tableHeader: "#fafaf9",
    tableRowHover: "#fafaf9",
    metadataBackground: "#fafaf9",
    totalsBackground: "#fafaf9",
    summaryHighlight: "#1c1917",
    badgeBackground: "#f5f5f4"
  },
  {
    id: "burgundy-rose",
    name: "Burgundy Editorial (Luxury Wine)",
    primary: "#4c0519",         // Rose 950 Deep Wine
    primarySoft: "#fff1f2",     // Rose 50
    accent: "#881337",          // Rose 900
    accentSoft: "#ffe4e6",      // Rose 100
    heading: "#1f2937",
    text: "#4b5563",
    muted: "#9ca3af",
    border: "#f3f4f6",
    surface: "#ffffff",
    cardSurface: "#fff1f2",
    divider: "#f3f4f6",
    accentLine: "#4c0519",
    tableHeader: "#fff1f2",
    tableRowHover: "#fff5f5",
    metadataBackground: "#fff1f2",
    totalsBackground: "#fff1f2",
    summaryHighlight: "#4c0519",
    badgeBackground: "#ffe4e6"
  },
  {
    id: "emerald-organic",
    name: "Emerald Organic (Sleek Green)",
    primary: "#064e3b",         // Emerald 900
    primarySoft: "#ecfdf5",     // Emerald 50
    accent: "#059669",          // Emerald 600
    accentSoft: "#d1fae5",      // Emerald 100
    heading: "#064e3b",
    text: "#374151",
    muted: "#6b7280",
    border: "#e5e7eb",
    surface: "#ffffff",
    cardSurface: "#ecfdf5",
    divider: "#f3f4f6",
    accentLine: "#064e3b",
    tableHeader: "#ecfdf5",
    tableRowHover: "#f0fdf4",
    metadataBackground: "#ecfdf5",
    totalsBackground: "#ecfdf5",
    summaryHighlight: "#064e3b",
    badgeBackground: "#d1fae5"
  },
  {
    id: "creative-amber",
    name: "Creative Amber (Burnt Gold)",
    primary: "#451a03",         // Amber 950
    primarySoft: "#fffbeb",     // Amber 50
    accent: "#78350f",          // Amber 900
    accentSoft: "#fef3c7",      // Amber 100
    heading: "#1f2937",
    text: "#4b5563",
    muted: "#9ca3af",
    border: "#f3f4f6",
    surface: "#ffffff",
    cardSurface: "#fffbeb",
    divider: "#f3f4f6",
    accentLine: "#451a03",
    tableHeader: "#fffbeb",
    tableRowHover: "#fffbeb",
    metadataBackground: "#fffbeb",
    totalsBackground: "#fffbeb",
    summaryHighlight: "#451a03",
    badgeBackground: "#fef3c7"
  }
];

/**
 * Returns a template theme by its ID, falling back to Slate theme if not found.
 */
export function getThemeById(id?: string): TemplateTheme {
  if (!id) return TEMPLATE_THEMES[0];
  return TEMPLATE_THEMES.find((theme) => theme.id === id) || TEMPLATE_THEMES[0];
}

/**
 * Parses Hex colors to standard RGB fractional 0-1 values for pdf-lib drawing operations.
 */
export function hexToPdfRgb(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    cleaned = cleaned.split("").map((c) => c + c).join("");
  }
  const num = parseInt(cleaned, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return { r, g, b };
}
