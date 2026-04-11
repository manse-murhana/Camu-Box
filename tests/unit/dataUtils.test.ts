import { describe, expect, it, vi } from "vitest";

import {
  base64urlDecode,
  base64urlEncode,
  countControlChars,
  detectAndDecodeText,
  ensureCompressionStreamSupported,
  ensureDecompressionStreamSupported,
  extractMidiInfo,
  isAsciiOnly,
  lzmaCompress,
  lzmaDecompress,
} from "../../src/utils/dataUtils";

describe("dataUtils", () => {
  it("detects ASCII-only strings", () => {
    expect(isAsciiOnly("MIDI Ready")).toBe(true);
    expect(isAsciiOnly("テスト")).toBe(false);
  });

  it("counts control characters", () => {
    expect(countControlChars("A\u0000B\u007FC")).toBe(2);
  });

  it("encodes and decodes base64url", () => {
    const source = Uint8Array.from([0, 255, 16, 32, 45]);

    const encoded = base64urlEncode(source);

    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(base64urlDecode(encoded)).toEqual(source);
  });

  it("decodes Shift-JIS-like byte strings when the decoded text is readable", () => {
    const shiftJisBytes = String.fromCharCode(0x82, 0xa0, 0x82, 0xa2);

    expect(detectAndDecodeText(shiftJisBytes)).toBe("あい");
  });

  it("returns the original text when decoding is not useful", () => {
    const text = "Plain ASCII";

    expect(detectAndDecodeText(text)).toBe(text);
    expect(detectAndDecodeText(undefined)).toBeUndefined();
  });

  it("extracts MIDI info from JSON payloads", () => {
    expect(extractMidiInfo('{"data":"abc","compression":"gzip"}')).toEqual({
      data: "abc",
      compression: "gzip",
    });
    expect(extractMidiInfo('{"data":"abc"}')).toEqual({ data: "abc", compression: undefined });
    expect(extractMidiInfo("not json")).toBeNull();
    expect(extractMidiInfo('{"compression":"gzip"}')).toBeNull();
    expect(extractMidiInfo("   ")).toBeNull();
  });

  it("throws when browser compression APIs are unavailable", () => {
    const compressionDescriptor = Object.getOwnPropertyDescriptor(globalThis, "CompressionStream");
    const decompressionDescriptor = Object.getOwnPropertyDescriptor(globalThis, "DecompressionStream");

    Reflect.deleteProperty(globalThis, "CompressionStream");
    Reflect.deleteProperty(globalThis, "DecompressionStream");

    expect(() => ensureCompressionStreamSupported()).toThrow(/CompressionStream/);
    expect(() => ensureDecompressionStreamSupported()).toThrow(/DecompressionStream/);

    if (compressionDescriptor) {
      Object.defineProperty(globalThis, "CompressionStream", compressionDescriptor);
    }
    if (decompressionDescriptor) {
      Object.defineProperty(globalThis, "DecompressionStream", decompressionDescriptor);
    }
  });

  it("delegates to global LZMA for compression and decompression", async () => {
    const compress = vi.fn((data: number[], mode: number, callback: (result: number[] | Uint8Array | null) => void) => {
      expect(data).toEqual([1, 2, 3]);
      expect(mode).toBe(4);
      callback(Uint8Array.from([9, 8, 7]));
    });
    const decompress = vi.fn((data: number[], callback: (result: number[] | Uint8Array) => void) => {
      expect(data).toEqual([9, 8, 7]);
      callback(Uint8Array.from([1, 2, 3]));
    });

    vi.stubGlobal("LZMA", { compress, decompress });

    await expect(lzmaCompress(Uint8Array.from([1, 2, 3]), 4)).resolves.toEqual(
      Uint8Array.from([9, 8, 7]),
    );
    await expect(lzmaDecompress(Uint8Array.from([9, 8, 7]))).resolves.toEqual(
      Uint8Array.from([1, 2, 3]),
    );
  });
});