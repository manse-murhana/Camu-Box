import lzmaScriptUrl from "lzma/src/lzma_worker-min.js?url";

import type { CompressionType } from "../types/web-music";

export const MAX_NFC_JSON_LENGTH = 8 * 1024;
export const MAX_COMPRESSED_MIDI_BYTES = 6 * 1024;
export const MAX_DECOMPRESSED_MIDI_BYTES = 256 * 1024;
export const MAX_DECOMPRESSION_RATIO = 40;

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const SUPPORTED_COMPRESSIONS = new Set(["gzip", "lzma"]);

export type ValidatedMidiInfo = {
  data: string;
  compression: CompressionType;
};

export type MidiInfoParseResult = {
  midiInfo: ValidatedMidiInfo | null;
  error?: string;
};

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

let lzmaLoadPromise: Promise<void> | null = null;

function isAsciiOnly(text: string): boolean {
  for (const char of text) {
    if (char.charCodeAt(0) > 0x7f) {
      return false;
    }
  }
  return true;
}

function countControlChars(text: string): number {
  let count = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    if ((code >= 0x00 && code <= 0x1f) || code === 0x7f) {
      count += 1;
    }
  }
  return count;
}

export function base64urlDecode(str: string): Uint8Array {
  const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function base64urlEncode(uint8Array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...uint8Array));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRequiredMidiInfoKey(key: string): key is "data" | "compression" {
  return key === "data" || key === "compression";
}

function isCompressionType(value: unknown): value is CompressionType {
  return typeof value === "string" && SUPPORTED_COMPRESSIONS.has(value);
}

function estimateBase64urlDecodedLength(data: string): number {
  return Math.floor((data.length * 3) / 4);
}

function parseMidiInfoPayload(text?: string): MidiInfoParseResult {
  const trimmed = text?.trim();
  if (!trimmed) {
    return { midiInfo: null, error: "payload is empty" };
  }

  if (trimmed.length > MAX_NFC_JSON_LENGTH) {
    return {
      midiInfo: null,
      error: `payload exceeds ${MAX_NFC_JSON_LENGTH} characters`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { midiInfo: null, error: "payload is not valid JSON" };
  }

  if (!isRecord(parsed)) {
    return { midiInfo: null, error: "payload root must be an object" };
  }

  const keys = Object.keys(parsed);
  const requiredKeys = ["data", "compression"];
  const missingKeys = requiredKeys.filter((key) => !(key in parsed));
  if (missingKeys.length > 0) {
    return {
      midiInfo: null,
      error: `payload is missing required field${missingKeys.length > 1 ? "s" : ""}: ${missingKeys.join(", ")}`,
    };
  }

  const unknownKeys = keys.filter((key) => !isRequiredMidiInfoKey(key));
  if (unknownKeys.length > 0) {
    return {
      midiInfo: null,
      error: `payload contains unknown field${unknownKeys.length > 1 ? "s" : ""}: ${unknownKeys.sort().join(", ")}`,
    };
  }
  if (typeof parsed.data !== "string" || parsed.data.length === 0) {
    return { midiInfo: null, error: "data must be a non-empty string" };
  }

  if (!BASE64URL_PATTERN.test(parsed.data) || parsed.data.length % 4 === 1) {
    return { midiInfo: null, error: "data must be base64url encoded" };
  }

  if (!isCompressionType(parsed.compression)) {
    return { midiInfo: null, error: "compression must be gzip or lzma" };
  }

  const estimatedCompressedSize = estimateBase64urlDecodedLength(parsed.data);
  if (estimatedCompressedSize > MAX_COMPRESSED_MIDI_BYTES) {
    return {
      midiInfo: null,
      error: `compressed payload exceeds ${MAX_COMPRESSED_MIDI_BYTES} bytes`,
    };
  }

  return {
    midiInfo: {
      data: parsed.data,
      compression: parsed.compression,
    },
  };
}

export function detectAndDecodeText(text?: string): string | undefined {
  if (!text) {
    return text;
  }
  if (isAsciiOnly(text)) {
    return text;
  }
  try {
    const bytes = new Uint8Array(text.split("").map((char) => char.charCodeAt(0)));
    const decoded = new TextDecoder("shift-jis").decode(bytes);
    const controlChars = countControlChars(decoded);
    if (decoded.length > 0 && controlChars / decoded.length < 0.1) {
      return decoded;
    }
  } catch {
    return text;
  }
  return text;
}

export function ensureCompressionStreamSupported(): void {
  if (typeof CompressionStream === "undefined") {
    throw new Error("CompressionStream is not supported in this browser");
  }
}

export function ensureDecompressionStreamSupported(): void {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("DecompressionStream is not supported in this browser");
  }
}

export async function gzipCompress(data: Uint8Array): Promise<Uint8Array> {
  ensureCompressionStreamSupported();
  const stream = new Blob([new Uint8Array(data)]).stream().pipeThrough(
    new CompressionStream("gzip"),
  );
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

export async function gzipDecompress(
  compressed: Uint8Array,
  maxBytes?: number,
): Promise<Uint8Array> {
  ensureDecompressionStreamSupported();
  const stream = new Blob([new Uint8Array(compressed)]).stream().pipeThrough(
    new DecompressionStream("gzip"),
  );

  if (maxBytes === undefined) {
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  }

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalSize += value.length;
    if (totalSize > maxBytes) {
      await reader.cancel();
      throw new Error(`Decompressed payload exceeds ${maxBytes} bytes`);
    }
    chunks.push(value);
  }

  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function ensureLzmaLoaded(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("LZMA can only be loaded in the browser");
  }
  if (typeof LZMA !== "undefined") {
    return;
  }
  if (!lzmaLoadPromise) {
    lzmaLoadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = lzmaScriptUrl;
      script.async = true;
      script.onload = () => {
        if (typeof LZMA !== "undefined") {
          resolve();
          return;
        }
        reject(new Error("LZMA load failed"));
      };
      script.onerror = () => reject(new Error("Failed to load LZMA script"));
      document.head.appendChild(script);
    });
  }
  return lzmaLoadPromise;
}

export async function lzmaCompress(data: Uint8Array, mode = 6): Promise<Uint8Array> {
  await ensureLzmaLoaded();

  return new Promise<Uint8Array>((resolve, reject) => {
    if (typeof LZMA === "undefined") {
      reject(new Error("LZMA compressor is unavailable"));
      return;
    }

    LZMA.compress(Array.from(data), mode, (result, error) => {
      if (error) {
        reject(new Error(`LZMA encoding failed: ${String(error)}`));
        return;
      }
      if (!result) {
        reject(new Error("LZMA encoding failed: empty result"));
        return;
      }
      resolve(result instanceof Uint8Array ? result : Uint8Array.from(result, (value) => value & 0xff));
    });
  });
}

export async function lzmaDecompress(
  compressed: Uint8Array,
  maxBytes?: number,
): Promise<Uint8Array> {
  await ensureLzmaLoaded();

  return new Promise<Uint8Array>((resolve, reject) => {
    if (typeof LZMA === "undefined") {
      reject(new Error("LZMA decoder is unavailable"));
      return;
    }

    LZMA.decompress(Array.from(compressed), (result, error) => {
      if (error) {
        reject(new Error(`LZMA decoding failed: ${String(error)}`));
        return;
      }
      const decoded = result instanceof Uint8Array ? result : new Uint8Array(result);
      if (maxBytes !== undefined && decoded.length > maxBytes) {
        reject(new Error(`Decompressed payload exceeds ${maxBytes} bytes`));
        return;
      }
      resolve(decoded);
    });
  });
}

export function validateMidiInfo(text?: string): MidiInfoParseResult {
  return parseMidiInfoPayload(text);
}