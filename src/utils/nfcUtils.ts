import type { MidiInfo, NdefMessageLike, NdefRecordLike } from "../types/web-music";

export type NfcScanSession = {
  stop: () => void;
};

type StartJsonNfcScanOptions = {
  onLog: (message: string) => void;
  onJsonPayload: (jsonText: string) => Promise<void>;
  onStateChange?: (active: boolean) => void;
  stopAfterSuccessMs?: number;
};

function decodeRecordData(record: NdefRecordLike): string | null {
  if (!record.data) {
    return null;
  }

  let bytes: Uint8Array;
  if (record.data instanceof ArrayBuffer) {
    bytes = new Uint8Array(record.data);
  } else {
    bytes = new Uint8Array(record.data.buffer, record.data.byteOffset, record.data.byteLength);
  }

  try {
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function parseNfcJsonPayload(text: string | null): MidiInfo | null {
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.data !== "string" || !parsed.data.trim()) {
      return null;
    }
    return {
      data: parsed.data,
      compression: typeof parsed.compression === "string" ? parsed.compression : undefined,
    };
  } catch {
    return null;
  }
}

function extractMidiJsonFromMessage(
  message: NdefMessageLike,
  log: (message: string) => void,
): string | null {
  const records = message.records;
  if (!records.length || records.length < 2) {
    log("NFC message has no data record");
    return null;
  }

  if ((records[1]?.mediaType || "").toLowerCase() !== "application/json") {
    log("NFC payload rejected: not JSON media type");
    return null;
  }

  const text = decodeRecordData(records[1]);
  const midiInfo = parseNfcJsonPayload(text);
  if (!midiInfo) {
    log('NFC payload rejected: invalid JSON format (required: {"data":"..."})');
    return null;
  }

  return JSON.stringify(midiInfo);
}

export function isWebNfcAvailable(): boolean {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

export async function startJsonNfcScan(
  options: StartJsonNfcScanOptions,
): Promise<NfcScanSession> {
  if (!isWebNfcAvailable()) {
    throw new Error("This browser does not support Web NFC API");
  }

  const { onLog, onJsonPayload, onStateChange, stopAfterSuccessMs = 5000 } = options;
  const controller = new AbortController();
  let stopScheduled = false;

  const stop = () => {
    stopScheduled = false;
    controller.abort();
    onStateChange?.(false);
  };

  const reader = new NDEFReader();
  await reader.scan({ signal: controller.signal });
  onLog("NFC reader starting");
  onStateChange?.(true);

  reader.onreading = async (event) => {
    if (stopScheduled) {
      onLog("NFC stop is scheduled, ignoring additional tag reads");
      return;
    }

    onLog("NFC tag detected");
    const jsonText = extractMidiJsonFromMessage(event.message, onLog);
    if (!jsonText) {
      return;
    }

    await onJsonPayload(jsonText);
    if (stopAfterSuccessMs <= 0) {
      stop();
      onLog("NFC reading stopped after successful MIDI load");
      return;
    }

    stopScheduled = true;
    onLog(`MIDI loaded. NFC reading will stop in ${stopAfterSuccessMs / 1000} seconds`);
    window.setTimeout(() => {
      stop();
      onLog("NFC reading stopped after successful MIDI load");
    }, stopAfterSuccessMs);
  };

  reader.onerror = (error: Error) => {
    onLog(`NFC error: ${error.message}`);
  };

  return { stop };
}

export async function writeJsonToNfc(jsonData: string, url: string): Promise<void> {
  if (!isWebNfcAvailable()) {
    throw new Error("Web NFC APIはこのブラウザまたは環境では利用できません");
  }

  const ndef = new NDEFReader();
  await ndef.write({
    records: [
      {
        recordType: "url",
        data: url,
      },
      {
        recordType: "mime",
        mediaType: "application/json",
        data: new TextEncoder().encode(jsonData),
      },
    ],
  });
}