import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { usePlayerStore } from "../../src/stores/playerStore";
import { magentaMusicMocks } from "../mocks/magentaMusic";

const playerMocks = vi.hoisted(() => ({
  MAX_COMPRESSED_MIDI_BYTES: 6 * 1024,
  MAX_DECOMPRESSED_MIDI_BYTES: 256 * 1024,
  MAX_DECOMPRESSION_RATIO: 40,
  base64urlDecode: vi.fn(() => Uint8Array.from([1, 2, 3])),
  detectAndDecodeText: vi.fn((value?: string) => value),
  extractMidiInfo: vi.fn(() => ({ data: "encoded-midi", compression: "gzip" })),
  gzipDecompress: vi.fn(async () => Uint8Array.from([11, 12, 13])),
  lzmaDecompress: vi.fn(async () => Uint8Array.from([21, 22, 23])),
  midiConstructor: vi.fn(),
  validateMidiInfo: vi.fn<
    (text?: string) => { midiInfo: { data: string; compression: "gzip" | "lzma" } | null; error?: string }
  >(() => ({ midiInfo: { data: "encoded-midi", compression: "gzip" } })),
}));

const parsedMidi = vi.hoisted(() => ({
  header: { name: "Mock Title" },
  duration: 65,
  tracks: [
    {
      channel: 0,
      instrument: { number: 5 },
      notes: [
        {
          midi: 60,
          time: 0,
          duration: 1,
          velocity: 0.5,
        },
      ],
    },
    {
      channel: 9,
      instrument: { number: 0 },
      notes: [
        {
          midi: 36,
          time: 0.5,
          duration: 0.5,
          velocity: 0.8,
        },
      ],
    },
  ],
}));

vi.mock("../../src/utils/dataUtils", () => ({
  MAX_COMPRESSED_MIDI_BYTES: playerMocks.MAX_COMPRESSED_MIDI_BYTES,
  MAX_DECOMPRESSED_MIDI_BYTES: playerMocks.MAX_DECOMPRESSED_MIDI_BYTES,
  MAX_DECOMPRESSION_RATIO: playerMocks.MAX_DECOMPRESSION_RATIO,
  base64urlDecode: playerMocks.base64urlDecode,
  detectAndDecodeText: playerMocks.detectAndDecodeText,
  extractMidiInfo: playerMocks.extractMidiInfo,
  gzipDecompress: playerMocks.gzipDecompress,
  lzmaDecompress: playerMocks.lzmaDecompress,
  validateMidiInfo: playerMocks.validateMidiInfo,
}));

vi.mock("@tonejs/midi", () => ({
  Midi: class {
    constructor(data: Uint8Array) {
      playerMocks.midiConstructor(data);
      return parsedMidi;
    }
  },
}));

describe("playerStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    playerMocks.extractMidiInfo.mockReturnValue({ data: "encoded-midi", compression: "gzip" });
    playerMocks.validateMidiInfo.mockReturnValue({
      midiInfo: { data: "encoded-midi", compression: "gzip" },
    });
    playerMocks.detectAndDecodeText.mockImplementation((value?: string) => value);
    playerMocks.gzipDecompress.mockResolvedValue(Uint8Array.from([11, 12, 13]));
    playerMocks.lzmaDecompress.mockResolvedValue(Uint8Array.from([21, 22, 23]));
    playerMocks.midiConstructor.mockClear();
    magentaMusicMocks.constructor.mockClear();
    magentaMusicMocks.loadSamples.mockResolvedValue(undefined);
    magentaMusicMocks.start.mockResolvedValue(undefined);
    magentaMusicMocks.stop.mockClear();
  });

  it("loads MIDI data from a gzip payload", async () => {
    const store = usePlayerStore();

    await store.loadMidiFromText('{"data":"encoded-midi","compression":"gzip"}');
    await Promise.resolve();

    expect(playerMocks.base64urlDecode).toHaveBeenCalledWith("encoded-midi");
    expect(playerMocks.gzipDecompress).toHaveBeenCalledWith(Uint8Array.from([1, 2, 3]));
    expect(playerMocks.midiConstructor).toHaveBeenCalledWith(Uint8Array.from([11, 12, 13]));
    expect(store.midiReady).toBe(true);
    expect(store.trackTitle).toBe("Mock Title");
    expect(store.trackDetails).toBe("2 tracks | 1:05");
  });

  it("logs an error for unsupported compression", async () => {
    const store = usePlayerStore();
    playerMocks.validateMidiInfo.mockReturnValue({
      midiInfo: null,
      error: "compression must be gzip or lzma",
    });

    await store.loadMidiFromText('{"data":"encoded-midi","compression":"brotli"}');

    expect(store.logs.at(-1)).toContain("compression must be gzip or lzma");
  });

  it("logs an error when the decompressed payload exceeds the size limit", async () => {
    const store = usePlayerStore();
    playerMocks.gzipDecompress.mockResolvedValue(
      new Uint8Array(playerMocks.MAX_DECOMPRESSED_MIDI_BYTES + 1),
    );

    await store.loadMidiFromText('{"data":"encoded-midi","compression":"gzip"}');

    expect(store.logs.at(-1)).toContain(
      `Decompressed payload exceeds ${playerMocks.MAX_DECOMPRESSED_MIDI_BYTES} bytes`,
    );
  });

  it("starts playback after loading a soundfont", async () => {
    const store = usePlayerStore();

    await store.loadMidiFromText('{"data":"encoded-midi","compression":"gzip"}');
    await Promise.resolve();
    await store.startPlayback();

    expect(magentaMusicMocks.constructor).toHaveBeenCalledTimes(1);
    expect(magentaMusicMocks.loadSamples).toHaveBeenCalledTimes(1);
    expect(magentaMusicMocks.start).toHaveBeenCalledTimes(1);
    expect(store.isPlaying).toBe(false);
    expect(store.logs.at(-1)).toContain("Playback completed");
  });

  it("logs when playback is requested without MIDI data", async () => {
    const store = usePlayerStore();

    await store.startPlayback();

    expect(store.logs.at(-1)).toContain("MIDI data is not loaded yet");
  });
});