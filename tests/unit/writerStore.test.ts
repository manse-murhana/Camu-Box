import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useWriterStore } from "../../src/stores/writerStore";

const writerMocks = vi.hoisted(() => ({
  gzipCompress: vi.fn(async () => Uint8Array.from([1, 2, 3])),
  lzmaCompress: vi.fn(async () => Uint8Array.from([4, 5, 6])),
  base64urlEncode: vi.fn(() => "encoded-midi"),
  writeJsonToNfc: vi.fn(async () => {}),
  getDefaultPlayerUrl: vi.fn(() => "https://example.com/#/player"),
  midiConstructor: vi.fn(),
  midiToArray: vi.fn(() => Uint8Array.from([10, 20, 30])),
}));

vi.mock("../../src/utils/dataUtils", () => ({
  base64urlEncode: writerMocks.base64urlEncode,
  gzipCompress: writerMocks.gzipCompress,
  lzmaCompress: writerMocks.lzmaCompress,
}));

vi.mock("../../src/utils/nfcUtils", () => ({
  writeJsonToNfc: writerMocks.writeJsonToNfc,
}));

vi.mock("../../src/utils/playerUrl", () => ({
  getDefaultPlayerUrl: writerMocks.getDefaultPlayerUrl,
}));

vi.mock("@tonejs/midi", () => ({
  Midi: class {
    constructor(data: Uint8Array) {
      writerMocks.midiConstructor(data);
    }

    toArray(): Uint8Array {
      return writerMocks.midiToArray();
    }
  },
}));

describe("writerStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    writerMocks.getDefaultPlayerUrl.mockReturnValue("https://example.com/#/player");
    writerMocks.midiToArray.mockReturnValue(Uint8Array.from([10, 20, 30]));
    writerMocks.midiConstructor.mockClear();
  });

  it("rejects non-MIDI files", async () => {
    const store = useWriterStore();
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });

    await store.processMidiFile(file);

    expect(store.statusType).toBe("error");
    expect(store.statusMessage).toBe("MIDIファイルのみサポートしています");
  });

  it("processes MIDI files and generates JSON data", async () => {
    const store = useWriterStore();
    const file = new File([Uint8Array.from([1, 2, 3])], "song.mid", { type: "audio/midi" });

    await store.processMidiFile(file);

    expect(writerMocks.midiConstructor).toHaveBeenCalledTimes(1);
    expect(writerMocks.lzmaCompress).toHaveBeenCalledWith(Uint8Array.from([10, 20, 30]));
    expect(store.currentJsonData).toBe('{"data":"encoded-midi","compression":"lzma"}');
    expect(store.requiredBytes).toBe(store.currentJsonData?.length);
    expect(store.statusType).toBe("success");
  });

  it("recompresses with gzip when the compression type changes", async () => {
    const store = useWriterStore();
    const file = new File([Uint8Array.from([1, 2, 3])], "song.mid", { type: "audio/midi" });

    await store.processMidiFile(file);
    await store.setCompressionType("gzip");

    expect(writerMocks.gzipCompress).toHaveBeenCalledWith(Uint8Array.from([10, 20, 30]));
    expect(store.compressionType).toBe("gzip");
    expect(store.statusMessage).toBe("圧縮形式を更新しました");
  });

  it("writes the current JSON payload to NFC", async () => {
    const store = useWriterStore();
    const file = new File([Uint8Array.from([1, 2, 3])], "song.mid", { type: "audio/midi" });

    await store.processMidiFile(file);
    await store.writeToNfc();

    expect(writerMocks.writeJsonToNfc).toHaveBeenCalledWith(
      '{"data":"encoded-midi","compression":"lzma"}',
      "https://example.com/#/player",
    );
    expect(store.statusType).toBe("success");
  });
});