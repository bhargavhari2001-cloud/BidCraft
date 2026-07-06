export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "bidcraft-theme";
export const DEFAULT_THEME: Theme = "dark";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : DEFAULT_THEME;
}

export function setStoredTheme(theme: Theme): void {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Applies the stored theme to <html> before React hydrates, so there's no
 * flash of the wrong theme on load. Inlined as a raw string and injected via
 * a <script> tag in the root layout — it must run synchronously, pre-hydration,
 * which rules out a normal component/effect.
 */
export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var theme = (stored === "light" || stored === "dark") ? stored : ${JSON.stringify(DEFAULT_THEME)};
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", ${JSON.stringify(DEFAULT_THEME)});
  }
})();
`;
