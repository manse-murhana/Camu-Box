const getPlayerApi = () => window.playerApi || null;
const nfcUtils = window.commonUtils;
if (!nfcUtils) {
  throw new Error("commonUtils is not loaded");
}
const nfcCommon = nfcUtils;

// AbortControllerを保持して、読み取りを中止できるようにする
let nfcAbortController: AbortController | null = null;
let nfcStopScheduled = false;
const NFC_STOP_DELAY_MS = 5000;

async function waitForMidiLoader(timeoutMs = 2000, intervalMs = 50) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const api = getPlayerApi();
    if (api?.loadMidiFromText) return api.loadMidiFromText;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return null;
}

function decodeNfcRecordData(record: NDEFRecordLike): string | null {
  try {
    if (!record.data) {
      return null;
    }
    return new TextDecoder().decode(record.data);
  } catch {
    return null;
  }
}

function parseNfcJsonPayload(text: string | null): MidiInfo | null {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.data !== "string" || !parsed.data.trim()) return null;
    return parsed; // JSON全体を返す
  } catch {
    return null;
  }
}

async function handleNfcMessage(message: NDEFMessage): Promise<void> {
  const api = getPlayerApi();
  if (!api) {
    console.warn("playerApi is not ready");
    return;
  }
  const log = api.log ?? ((message: string) => console.log(message));

  if (nfcStopScheduled) {
    log("NFC stop is scheduled, ignoring additional tag reads");
    return;
  }

  const records = message?.records;
  if (!records?.length || records.length < 2) {
    log("NFC message has no data record");
    return;
  }

  if ((records[1]?.mediaType || "").toLowerCase() !== "application/json") {
    log("NFC payload rejected: not JSON media type");
    return;
  }

  const text = decodeNfcRecordData(records[1]);
  const midiJson = parseNfcJsonPayload(text);
  if (!midiJson) {
    log(
      'NFC payload rejected: invalid JSON format (required: {"data":"..."})',
    );
    return;
  }

  log("NFC JSON payload detected");
  const loadMidi = await waitForMidiLoader();
  if (loadMidi) {
    await loadMidi(JSON.stringify(midiJson));

    nfcStopScheduled = true;
    log(`MIDI loaded. NFC reading will stop in ${NFC_STOP_DELAY_MS / 1000} seconds`);
    await new Promise((resolve) => setTimeout(resolve, NFC_STOP_DELAY_MS));

    // MIDI読み込み成功後、5秒待ってからNFC読み取りを中止
    stopNfcReader();
    log("NFC reading stopped 5 seconds after successful MIDI load");
  } else {
    log("MIDI loader is not ready");
  }
}

function stopNfcReader() {
  nfcStopScheduled = false;
  if (nfcAbortController) {
    nfcAbortController.abort();
    nfcAbortController = null;

    // NFCコントロール全体を非表示にする
    const nfcControls = document.getElementById("nfcControls");
    if (nfcControls) {
      nfcControls.style.display = "none";
    }
  }
}

async function startNfcReader() {
  const api = getPlayerApi();
  if (!api) {
    console.warn("playerApi is not ready");
    return;
  }
  const log = api.log ?? ((message: string) => console.log(message));

  const nfcWarning = nfcCommon.getElementByClass(
    ".nfc-warning",
    HTMLElement,
  );

  if (!("NDEFReader" in window)) {
    log("Error: This browser does not support Web NFC API");
    return;
  }

  try {
    log("NFC reader starting");
    nfcStopScheduled = false;

    // 新しいAbortControllerを作成
    nfcAbortController = new AbortController();

    const nfcReader = new NDEFReader();
    await nfcReader.scan({ signal: nfcAbortController.signal });

    // Update UI to show scan is active
    const startBtn = nfcCommon.getElementById(
      "startNfcBtn",
      HTMLButtonElement,
    );
    if (startBtn) {
      startBtn.textContent = "タグをかざしてください...";
      startBtn.disabled = true;
    }
    if (nfcWarning) {
      nfcWarning.innerHTML = "信頼できるタグのみスキャンしてください。";
      nfcWarning.style.display = "block";
    }

    nfcReader.onreading = (event) => {
      log("NFC tag detected");
      handleNfcMessage(event.message);
    };

    nfcReader.onerror = (error: Error) => {
      log("NFC error: " + error.message);
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      log("NFC scan aborted");
    } else {
      const message = nfcCommon.toMessage(error);
      log("NFC scan failed: " + message);
    }
  }
}

// Attach event listener to button when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const startBtn = nfcCommon.getElementById(
      "startNfcBtn",
      HTMLButtonElement,
    );
    if (startBtn) {
      startBtn.addEventListener("click", startNfcReader);
    }
  });
} else {
  const startBtn = nfcCommon.getElementById(
    "startNfcBtn",
    HTMLButtonElement,
  );
  if (startBtn) {
    startBtn.addEventListener("click", startNfcReader);
  }
}
