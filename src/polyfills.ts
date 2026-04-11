import { Buffer as BufferPolyfill } from "buffer";

declare global {
  var global: typeof globalThis;
  var Buffer: unknown;
}

if (typeof globalThis.global === "undefined") {
  globalThis.global = globalThis;
}

if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = BufferPolyfill;
}

export {};