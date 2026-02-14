// Theme settings
const themes = {
  default: {
    "--bg-gradient-start": "#667eea",
    "--bg-gradient-end": "#764ba2",
    "--track-gradient-start": "#667eea",
    "--track-gradient-end": "#764ba2",
    "--play-gradient-start": "#667eea",
    "--play-gradient-end": "#764ba2",
    "--stop-gradient-start": "#fc466b",
    "--stop-gradient-end": "#3f5efb",
    "--play-shadow": "rgba(102, 126, 234, 0.4)",
    "--play-shadow-hover": "rgba(102, 126, 234, 0.6)",
    "--stop-shadow": "rgba(252, 70, 107, 0.4)",
    "--stop-shadow-hover": "rgba(252, 70, 107, 0.6)",
  },
  dark: {
    "--bg-gradient-start": "#232526",
    "--bg-gradient-end": "#414345",
    "--track-gradient-start": "#434343",
    "--track-gradient-end": "#000000",
    "--play-gradient-start": "#434343",
    "--play-gradient-end": "#000000",
    "--stop-gradient-start": "#e74c3c",
    "--stop-gradient-end": "#c0392b",
    "--play-shadow": "rgba(0, 0, 0, 0.5)",
    "--play-shadow-hover": "rgba(0, 0, 0, 0.7)",
    "--stop-shadow": "rgba(231, 76, 60, 0.4)",
    "--stop-shadow-hover": "rgba(231, 76, 60, 0.6)",
  },
  ocean: {
    "--bg-gradient-start": "#2E3192",
    "--bg-gradient-end": "#1BFFFF",
    "--track-gradient-start": "#00d2ff",
    "--track-gradient-end": "#3a7bd5",
    "--play-gradient-start": "#00d2ff",
    "--play-gradient-end": "#3a7bd5",
    "--stop-gradient-start": "#ff6b6b",
    "--stop-gradient-end": "#ee5a6f",
    "--play-shadow": "rgba(0, 210, 255, 0.4)",
    "--play-shadow-hover": "rgba(0, 210, 255, 0.6)",
    "--stop-shadow": "rgba(255, 107, 107, 0.4)",
    "--stop-shadow-hover": "rgba(255, 107, 107, 0.6)",
  },
  sunset: {
    "--bg-gradient-start": "#FA8BFF",
    "--bg-gradient-end": "#2BD2FF",
    "--track-gradient-start": "#fa709a",
    "--track-gradient-end": "#fee140",
    "--play-gradient-start": "#fa709a",
    "--play-gradient-end": "#fee140",
    "--stop-gradient-start": "#ff6b95",
    "--stop-gradient-end": "#ff5e62",
    "--play-shadow": "rgba(250, 112, 154, 0.4)",
    "--play-shadow-hover": "rgba(250, 112, 154, 0.6)",
    "--stop-shadow": "rgba(255, 107, 149, 0.4)",
    "--stop-shadow-hover": "rgba(255, 107, 149, 0.6)",
  },
  forest: {
    "--bg-gradient-start": "#134E5E",
    "--bg-gradient-end": "#71B280",
    "--track-gradient-start": "#56ab2f",
    "--track-gradient-end": "#a8e063",
    "--play-gradient-start": "#56ab2f",
    "--play-gradient-end": "#a8e063",
    "--stop-gradient-start": "#f46b45",
    "--stop-gradient-end": "#eea849",
    "--play-shadow": "rgba(86, 171, 47, 0.4)",
    "--play-shadow-hover": "rgba(86, 171, 47, 0.6)",
    "--stop-shadow": "rgba(244, 107, 69, 0.4)",
    "--stop-shadow-hover": "rgba(244, 107, 69, 0.6)",
  },
};

function applyTheme(themeName, logCallback) {
  const theme = themes[themeName] || themes.default;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(key, value);
  }
  if (logCallback) {
    logCallback(`Theme applied: ${themeName}`);
  }
}

window.themes = themes;
window.applyTheme = applyTheme;
