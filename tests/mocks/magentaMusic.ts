import { vi } from "vitest";

export const magentaMusicMocks = {
  constructor: vi.fn(),
  loadSamples: vi.fn(async () => {}),
  start: vi.fn(async () => {}),
  stop: vi.fn(),
};

export class SoundFontPlayer {
  constructor(baseUrl: string) {
    magentaMusicMocks.constructor(baseUrl);
  }

  loadSamples = magentaMusicMocks.loadSamples;
  start = magentaMusicMocks.start;
  stop = magentaMusicMocks.stop;
}