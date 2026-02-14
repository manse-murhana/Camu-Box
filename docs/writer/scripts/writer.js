const uploadArea = document.getElementById("uploadArea");
const midiInput = document.getElementById("midiInput");
const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const urlInputSection = document.getElementById("urlInputSection");
const playerUrl = document.getElementById("playerUrl");
const statusElement = document.getElementById("status");
const outputSection = document.getElementById("outputSection");
const outputBox = document.getElementById("outputBox");
const nfcBtn = document.getElementById("nfcBtn");

let currentJsonData = null;

uploadArea.addEventListener("click", () => midiInput.click());

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("drag-over");
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("drag-over");
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("drag-over");
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    processMidiFile(files[0]);
  }
});

midiInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    processMidiFile(e.target.files[0]);
  }
});

function base64urlEncode(uint8Array) {
  const base64 = btoa(String.fromCharCode(...uint8Array));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function ensureCompressionStreamSupported() {
  if (typeof CompressionStream === "undefined") {
    throw new Error("CompressionStream is not supported in this browser");
  }
}

async function gzipCompress(data) {
  ensureCompressionStreamSupported();
  const cs = new CompressionStream("gzip");
  const stream = new Blob([data]).stream().pipeThrough(cs);
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

function showStatus(message, type) {
  statusElement.textContent = message;
  statusElement.className = `status show ${type}`;
}

async function processMidiFile(file) {
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
  } catch (err) {
    console.error(err);
    showStatus("❌ エラー: " + err.message, "error");
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
  } catch (err) {
    console.error(err);
    if (err.name === "NotSupportedError") {
      showStatus("❌ Web NFC APIがこのブラウザで利用できません", "error");
    } else if (err.name === "NotAllowedError") {
      showStatus("❌ NFCの使用許可が得られませんでした", "error");
    } else if (err.name === "AbortError") {
      showStatus("⚠️ 書き込みが中止されました", "processing");
    } else if (err.name === "NetworkError") {
      showStatus(
        "❌ 書き込みに失敗しました。NFCタグがしっかりと接触しているか、またNFCタグの容量が不足していないか確認してください。",
        "error",
      );
    } else {
      showStatus("❌ エラー: " + err.message, "error");
    }
  } finally {
    nfcBtn.disabled = !currentJsonData;
  }
}

nfcBtn.addEventListener("click", writeNfcTag);

updateNfcButtonState();
