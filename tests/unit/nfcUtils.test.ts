import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isWebNfcAvailable, startJsonNfcScan, writeJsonToNfc } from "../../src/utils/nfcUtils";

type MockNdefEvent = {
  message: {
    records: Array<{
      mediaType?: string;
      data?: BufferSource;
    }>;
  };
};

class MockNDEFReader {
  static instances: MockNDEFReader[] = [];

  onreading: ((event: MockNdefEvent) => void | Promise<void>) | null = null;
  onerror: ((error: Error) => void) | null = null;
  scan = vi.fn(async () => {});
  write = vi.fn(async () => {});

  constructor() {
    MockNDEFReader.instances.push(this);
  }
}

describe("nfcUtils", () => {
  beforeEach(() => {
    MockNDEFReader.instances = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window as Window & { NDEFReader?: typeof NDEFReader }, "NDEFReader");
  });

  it("detects Web NFC availability", () => {
    expect(isWebNfcAvailable()).toBe(false);

    vi.stubGlobal("NDEFReader", MockNDEFReader);

    expect(isWebNfcAvailable()).toBe(true);
  });

  it("starts scanning and emits a valid JSON payload", async () => {
    const onLog = vi.fn();
    const onJsonPayload = vi.fn<(jsonText: string) => Promise<void>>(async () => {});
    const onStateChange = vi.fn();

    vi.stubGlobal("NDEFReader", MockNDEFReader);

    const session = await startJsonNfcScan({
      onLog,
      onJsonPayload,
      onStateChange,
      stopAfterSuccessMs: 0,
    });

    const reader = MockNDEFReader.instances[0];
    await reader.onreading?.({
      message: {
        records: [
          { data: new TextEncoder().encode("https://example.com") },
          {
            mediaType: "application/json",
            data: new TextEncoder().encode('{"data":"encoded-midi","compression":"gzip"}'),
          },
        ],
      },
    });

    expect(reader.scan).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenNthCalledWith(1, true);
    expect(onJsonPayload).toHaveBeenCalledTimes(1);
    const payload = onJsonPayload.mock.calls[0]?.[0];

    expect(payload).toBeTypeOf("string");
    expect(JSON.parse(payload as string)).toEqual({
      data: "encoded-midi",
      compression: "gzip",
    });

    session.stop();
    expect(onStateChange).toHaveBeenLastCalledWith(false);
  });

  it("logs invalid payloads without invoking the callback", async () => {
    const onLog = vi.fn();
    const onJsonPayload = vi.fn<(jsonText: string) => Promise<void>>(async () => {});

    vi.stubGlobal("NDEFReader", MockNDEFReader);

    await startJsonNfcScan({
      onLog,
      onJsonPayload,
    });

    const reader = MockNDEFReader.instances[0];
    await reader.onreading?.({
      message: {
        records: [
          { data: new TextEncoder().encode("https://example.com") },
          {
            mediaType: "text/plain",
            data: new TextEncoder().encode("hello"),
          },
        ],
      },
    });

    expect(onJsonPayload).not.toHaveBeenCalled();
    expect(onLog).toHaveBeenCalledWith("NFC payload rejected: not JSON media type");
  });

  it("rejects payloads that do not match the strict schema", async () => {
    const onLog = vi.fn();
    const onJsonPayload = vi.fn<(jsonText: string) => Promise<void>>(async () => {});

    vi.stubGlobal("NDEFReader", MockNDEFReader);

    await startJsonNfcScan({
      onLog,
      onJsonPayload,
    });

    const reader = MockNDEFReader.instances[0];
    await reader.onreading?.({
      message: {
        records: [
          { data: new TextEncoder().encode("https://example.com") },
          {
            mediaType: "application/json",
            data: new TextEncoder().encode('{"data":"encoded-midi","extra":true}'),
          },
        ],
      },
    });

    expect(onJsonPayload).not.toHaveBeenCalled();
    expect(onLog).toHaveBeenCalledWith(
      "NFC payload rejected: payload is missing required field: compression",
    );
  });

  it("writes URL and JSON records to NFC", async () => {
    vi.stubGlobal("NDEFReader", MockNDEFReader);

    await writeJsonToNfc('{"data":"abc"}', "https://example.com/#/player");

    const reader = MockNDEFReader.instances[0];
    expect(reader.write).toHaveBeenCalledWith({
      records: [
        {
          recordType: "url",
          data: "https://example.com/#/player",
        },
        {
          recordType: "mime",
          mediaType: "application/json",
          data: new TextEncoder().encode('{"data":"abc"}'),
        },
      ],
    });
  });
});