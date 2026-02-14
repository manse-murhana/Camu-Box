const writerUtils = window.commonUtils;
if (!writerUtils) {
  throw new Error("commonUtils is not loaded");
}
const writerCommon = writerUtils;

const uploadArea = writerCommon.requireElement("uploadArea", HTMLElement);
const midiInput = writerCommon.requireElement("midiInput", HTMLInputElement);
const fileInfo = writerCommon.requireElement("fileInfo", HTMLElement);
const fileName = writerCommon.requireElement("fileName", HTMLElement);
const fileSize = writerCommon.requireElement("fileSize", HTMLElement);
const urlInputSection = writerCommon.requireElement("urlInputSection", HTMLElement);
const playerUrl = writerCommon.requireElement("playerUrl", HTMLInputElement);
const statusElement = writerCommon.requireElement("status", HTMLElement);
const outputSection = writerCommon.requireElement("outputSection", HTMLElement);
const outputBox = writerCommon.requireElement("outputBox", HTMLElement);
const nfcBtn = writerCommon.requireElement("nfcBtn", HTMLButtonElement);

let currentJsonData: string | null = null;

uploadArea.addEventListener("click", () => midiInput.click());

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("drag-over");
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("drag-over");
});

uploadArea.addEventListener("drop", (e: DragEvent) => {
  e.preventDefault();
  uploadArea.classList.remove("drag-over");
  const files = e.dataTransfer?.files;
  if (!files) {
    return;
  }
  if (files.length > 0) {
    processMidiFile(files[0]);
  }
});

midiInput.addEventListener("change", () => {
  const files = midiInput.files;
  if (files && files.length > 0) {
    processMidiFile(files[0]);
  }
});

function base64urlEncode(uint8Array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...uint8Array));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function ensureCompressionStreamSupported() {
  if (typeof CompressionStream === "undefined") {
    throw new Error("CompressionStream is not supported in this browser");
  }
}

async function gzipCompress(data: Uint8Array): Promise<Uint8Array> {
  ensureCompressionStreamSupported();
  const cs = new CompressionStream("gzip");
  const source = new Uint8Array(data);
  const stream = new Blob([source]).stream().pipeThrough(cs);
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

function showStatus(message: string, type: string): void {
  statusElement.textContent = message;
  statusElement.className = `status show ${type}`;
}

async function processMidiFile(file: File): Promise<void> {
  try {
    // Check file type
    if (
      !file.type.includes("audio/midi") &&
      !file.name.toLowerCase().endsWith(".mid") &&
      !file.name.toLowerCase().endsWith(".midi")
    ) {
      showStatus("❌ MIDIファイルのみサポートしています", "error");
      return;
    }

    // Show file info
    fileInfo.classList.add("show");
    fileName.textContent = `📄 ${file.name}`;
    fileSize.textContent = `サイズ: ${(file.size / 1024).toFixed(2)} KB`;

    showStatus("⏳ 処理中...", "processing");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Parse MIDI
    const midi = new Midi(buffer);
    const midiData = midi.toArray();

    console.log("Original size:", buffer.length, "bytes");
    console.log("Reserialized size:", midiData.length, "bytes");

    // Compress with CompressionStream (gzip)
    const compressed = await gzipCompress(midiData);

    console.log("Compressed size:", compressed.length, "bytes");

    // Encode to base64url
    const encoded = base64urlEncode(compressed);

    // Create JSON
    const jsonData = {
      data: encoded,
      compression: "gzip",
    };
    const jsonString = JSON.stringify(jsonData);

    // Display NFC tag write size only
    outputBox.textContent = `必要な容量: ${jsonString.length} bytes`;
    currentJsonData = jsonString;
    urlInputSection.classList.add("show");
    outputSection.classList.add("show");
    updateNfcButtonState();

    showStatus("✅ 変換完了！", "success");
  } catch (err: unknown) {
    console.error(err);
    const message = writerCommon.toMessage(err);
    showStatus("❌ エラー: " + message, "error");
  }
}

function updateNfcButtonState() {
  nfcBtn.disabled = !currentJsonData;
}

async function writeNfcTag() {
  if (!currentJsonData) {
    showStatus("❌ データがありません", "error");
    return;
  }

  try {
    showStatus("⏳ NFCタグに接触してください...", "processing");
    nfcBtn.disabled = true;

    if (!("NDEFReader" in window)) {
      throw new Error("Web NFC APIはこのブラウザまたは環境では利用できません");
    }

    const ndef = new NDEFReader();
    const url =
      playerUrl.value.trim() ||
      "https://manse-murhana.github.io/Camu-Box/player/";
    const records = [
      {
        recordType: "url",
        data: url,
      },
      {
        recordType: "mime",
        mediaType: "application/json",
        data: new TextEncoder().encode(currentJsonData),
      },
    ];

    await ndef.write({
      records: records,
    });

    showStatus("✅ NFCタグへの書き込みが完了しました！", "success");
  } catch (err: unknown) {
    console.error(err);
    const errorName = writerCommon.getName(err);
    const message = writerCommon.toMessage(err);
    if (errorName === "NotSupportedError") {
      showStatus("❌ Web NFC APIがこのブラウザで利用できません", "error");
    } else if (errorName === "NotAllowedError") {
      showStatus("❌ NFCの使用許可が得られませんでした", "error");
    } else if (errorName === "AbortError") {
      showStatus("⚠️ 書き込みが中止されました", "processing");
    } else if (errorName === "NetworkError") {
      showStatus(
        "❌ 書き込みに失敗しました。NFCタグがしっかりと接触しているか、またNFCタグの容量が不足していないか確認してください。",
        "error",
      );
    } else {
      showStatus("❌ エラー: " + message, "error");
    }
  } finally {
    nfcBtn.disabled = !currentJsonData;
  }
}

nfcBtn.addEventListener("click", writeNfcTag);

updateNfcButtonState();
