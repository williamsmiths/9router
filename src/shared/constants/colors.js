// Teal accent palette for 9Router dashboard

export const COLORS = {
  primary: {
    DEFAULT: "#14B8A6",
    hover: "#0D9488",
    light: "#5EEAD4",
    dark: "#0F766E",
  },

  light: {
    bg: "#F6FAFA",
    bgAlt: "#EFF6F5",
    surface: "#FFFFFF",
    sidebar: "rgba(236, 254, 252, 0.88)",
    border: "rgba(0, 0, 0, 0.1)",
    textMain: "#0f172a",
    textMuted: "#64748b",
  },

  dark: {
    bg: "#1a1a1a",
    bgAlt: "#1F1F1E",
    surface: "#262626",
    sidebar: "rgba(24, 32, 31, 0.92)",
    border: "rgba(255, 255, 255, 0.1)",
    textMain: "#ECEBE8",
    textMuted: "#9ca3af",
  },

  status: {
    success: "#22C55E",
    successLight: "#DCFCE7",
    successDark: "#166534",
    warning: "#F59E0B",
    warningLight: "#FEF3C7",
    warningDark: "#92400E",
    error: "#EF4444",
    errorLight: "#FEE2E2",
    errorDark: "#991B1B",
    info: "#3B82F6",
    infoLight: "#DBEAFE",
    infoDark: "#1E40AF",
  },
};

export const CSS_VARIABLES = {
  light: {
    "--color-primary": COLORS.primary.DEFAULT,
    "--color-primary-hover": COLORS.primary.hover,
    "--color-bg": COLORS.light.bg,
    "--color-bg-alt": COLORS.light.bgAlt,
    "--color-surface": COLORS.light.surface,
    "--color-sidebar": COLORS.light.sidebar,
    "--color-border": COLORS.light.border,
    "--color-text-main": COLORS.light.textMain,
    "--color-text-muted": COLORS.light.textMuted,
  },
  dark: {
    "--color-primary": COLORS.primary.light,
    "--color-primary-hover": COLORS.primary.DEFAULT,
    "--color-bg": COLORS.dark.bg,
    "--color-bg-alt": COLORS.dark.bgAlt,
    "--color-surface": COLORS.dark.surface,
    "--color-sidebar": COLORS.dark.sidebar,
    "--color-border": COLORS.dark.border,
    "--color-text-main": COLORS.dark.textMain,
    "--color-text-muted": COLORS.dark.textMuted,
  },
};
