import lzmaScriptUrl from "lzma/src/lzma_worker-min.js?url";

import type { MidiInfo } from "../types/web-music";

let lzmaLoadPromise: Promise<void> | null = null;

export function isAsciiOnly(text: string): boolean {
  for (const char of text) {
    if (char.charCodeAt(0) > 0x7f) {
      return false;
    }
  }
  return true;
}

export function countControlChars(text: string): number {
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

export async function gzipDecompress(compressed: Uint8Array): Promise<Uint8Array> {
  ensureDecompressionStreamSupported();
  const stream = new Blob([new Uint8Array(compressed)]).stream().pipeThrough(
    new DecompressionStream("gzip"),
  );
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
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

export async function lzmaDecompress(compressed: Uint8Array): Promise<Uint8Array> {
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
      resolve(result instanceof Uint8Array ? result : new Uint8Array(result));
    });
  });
}

export function extractMidiInfo(text?: string): MidiInfo | null {
  const trimmed = text?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed?.data === "string") {
      return {
        data: parsed.data,
        compression:
          typeof parsed.compression === "string" ? parsed.compression : undefined,
      };
    }
  } catch {
    return null;
  }

  return null;
}