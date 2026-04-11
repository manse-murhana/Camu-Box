const themes: Record<string, Record<string, string>> = {
  default: {
    "--bg-gradient-start": "#667eea",
    "--bg-gradient-end": "#764ba2",
    "--track-gradient-start": "#667eea",
    "--track-gradient-end": "#764ba2",
    "--play-gradient-start": "#667eea",
    "--play-gradient-end": "#764ba2",
    "--stop-gradient-start": "#fc466b",
    "--stop-gradient-end": "#3f5efb",
  },
  ocean: {
    "--bg-gradient-start": "#2e3192",
    "--bg-gradient-end": "#1bffff",
    "--track-gradient-start": "#00d2ff",
    "--track-gradient-end": "#3a7bd5",
    "--play-gradient-start": "#00d2ff",
    "--play-gradient-end": "#3a7bd5",
    "--stop-gradient-start": "#ff6b6b",
    "--stop-gradient-end": "#ee5a6f",
  },
};

export function applyTheme(
  themeName: string,
  logCallback?: (message: string) => void,
): void {
  const root = document.documentElement;
  const theme = themes[themeName] || themes.default;

  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(key, value);
  }

  logCallback?.(`Theme applied: ${themeName}`);
}

export { themes };