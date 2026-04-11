import { describe, expect, it } from "vitest";

import { getDefaultPlayerUrl } from "../../src/utils/playerUrl";

describe("playerUrl", () => {
  it("builds a player URL from the current origin", () => {
    expect(getDefaultPlayerUrl()).toBe("http://localhost:3000/#/player");
  });

  it("falls back to the published URL when window is unavailable", () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
    });

    expect(getDefaultPlayerUrl()).toBe("https://manse-murhana.github.io/Camu-Box/#/player");

    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    }
  });
});