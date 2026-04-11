import { describe, expect, it, vi } from "vitest";

import { applyTheme } from "../../src/utils/themes";

describe("themes", () => {
  it("applies CSS variables and logs the applied theme", () => {
    const setProperty = vi.spyOn(document.documentElement.style, "setProperty");
    const log = vi.fn();

    applyTheme("ocean", log);

    expect(setProperty).toHaveBeenCalledWith("--bg-gradient-start", "#2e3192");
    expect(setProperty).toHaveBeenCalledWith("--play-gradient-end", "#3a7bd5");
    expect(log).toHaveBeenCalledWith("Theme applied: ocean");
  });

  it("falls back to the default theme", () => {
    const setProperty = vi.spyOn(document.documentElement.style, "setProperty");

    applyTheme("unknown-theme");

    expect(setProperty).toHaveBeenCalledWith("--bg-gradient-start", "#667eea");
  });
});