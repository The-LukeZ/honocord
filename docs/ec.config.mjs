// @ts-check
// Expressive Code options. Kept here, not in astro.config.mjs, because the
// <Code> component needs them and they include a function.
import { defineEcConfig } from "@astrojs/starlight/expressive-code";

export default defineEcConfig({
  // One dark theme for both modes: code blocks are always dark.
  themes: ["github-dark"],
  useStarlightDarkModeSwitch: false,
  useStarlightUiThemeColors: false,
  customizeTheme(theme) {
    // Flame for keywords, blurple for strings, types and functions.
    const swaps = { "#f97583": "#FF8C5A", "#9ecbff": "#A3ABFF", "#b392f0": "#A3ABFF" };
    for (const setting of theme.settings) {
      const color = setting.settings.foreground?.toLowerCase();
      if (color && swaps[color]) setting.settings.foreground = swaps[color];
    }
    return theme;
  },
  styleOverrides: {
    codeBackground: "var(--hc-code-bg)",
    borderRadius: "6px",
    borderColor: "#FFFFFF1F",
    codeFontFamily: "'JetBrains Mono', ui-monospace, monospace",
    uiFontFamily: "var(--sl-font)",
    frames: {
      // Filename tab: outlined, on a slightly lighter bar, merging into the code.
      editorTabBarBackground: "color-mix(in oklab, var(--hc-code-bg) 88%, white)",
      editorActiveTabBackground: "var(--hc-code-bg)",
      editorTabBarBorderColor: "#FFFFFF1F",
      editorTabBarBorderBottomColor: "#FFFFFF1F",
      editorActiveTabBorderColor: "#FFFFFF1F",
      editorActiveTabIndicatorTopColor: "transparent",
      editorActiveTabIndicatorBottomColor: "transparent",
      editorActiveTabForeground: "#B5BAC1",
      terminalTitlebarBorderBottomColor: "#FFFFFF1F",
      terminalTitlebarBackground: "color-mix(in oklab, var(--hc-code-bg) 88%, white)",
      terminalBackground: "var(--hc-code-bg)",
      frameBoxShadowCssValue: "none",
    },
  },
});
