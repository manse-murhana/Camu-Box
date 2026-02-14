const getPlayerApi = () => window.playerApi || null;

// AbortControllerを保持して、読み取りを中止できるようにする
let nfcAbortController = null;

async function waitForMidiLoader(timeoutMs = 2000, intervalMs = 50) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const api = getPlayerApi();
    if (api?.loadMidiFromText) return api.loadMidiFromText;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return null;
}

function decodeNfcRecordData(record) {
  try {
    return new TextDecoder().decode(record.data);
  } catch {
    return null;
  }
}

function parseNfcJsonPayload(text) {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.data !== "string" || !parsed.data.trim()) return null;
    return parsed; // JSON全体を返す
  } catch {
    return null;
  }
}

async function handleNfcMessage(message) {
  const api = getPlayerApi();
  if (!api) {
    console.warn("playerApi is not ready");
    return;
  }

  const records = message?.records;
  if (!records?.length || records.length < 2) {
    api.log("NFC message has no data record");
    return;
  }

  if ((records[1]?.mediaType || "").toLowerCase() !== "application/json") {
    api.log("NFC payload rejected: not JSON media type");
    return;
  }

  const text = decodeNfcRecordData(records[1]);
  const midiJson = parseNfcJsonPayload(text);
  if (!midiJson) {
    api.log(
      'NFC payload rejected: invalid JSON format (required: {"data":"..."})',
    );
    return;
  }

  api.log("NFC JSON payload detected");
  const loadMidi = await waitForMidiLoader();
  if (loadMidi) {
    await loadMidi(JSON.stringify(midiJson));

    // MIDI読み込み成功後、NFC読み取りを中止
    stopNfcReader();
    api.log("NFC reading stopped after successful MIDI load");
  } else {
    api.log("MIDI loader is not ready");
  }
}

function stopNfcReader() {
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

  const nfcWarning = document.querySelector(".nfc-warning");

  if (!("NDEFReader" in window)) {
    api.log("Error: This browser does not support Web NFC API");
    return;
  }

  try {
    api.log("NFC reader starting");

    // 新しいAbortControllerを作成
    nfcAbortController = new AbortController();

    const nfcReader = new NDEFReader();
    await nfcReader.scan({ signal: nfcAbortController.signal });

    // Update UI to show scan is active
    const startBtn = document.getElementById("startNfcBtn");
    if (startBtn) {
      startBtn.textContent = "タグをかざしてください...";
      startBtn.disabled = true;
    }
    if (nfcWarning) {
      nfcWarning.innerHTML = "信頼できるタグのみスキャンしてください。";
      nfcWarning.style.display = "block";
    }

    nfcReader.onreading = (event) => {
      api.log("NFC tag detected");
      handleNfcMessage(event.message);
    };

    nfcReader.onerror = (error) => {
      api.log("NFC error: " + error.message);
    };
  } catch (error) {
    if (error.name === "AbortError") {
      api.log("NFC scan aborted");
    } else {
      api.log("NFC scan failed: " + error.message);
    }
  }
}

// Attach event listener to button when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startNfcBtn");
    if (startBtn) {
      startBtn.addEventListener("click", startNfcReader);
    }
  });
} else {
  const startBtn = document.getElementById("startNfcBtn");
  if (startBtn) {
    startBtn.addEventListener("click", startNfcReader);
  }
}
