import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { Midi } from "@tonejs/midi";

import { base64urlEncode, gzipCompress } from "../utils/dataUtils";
import { writeJsonToNfc } from "../utils/nfcUtils";
import { getDefaultPlayerUrl } from "../utils/playerUrl";

type StatusType = "idle" | "processing" | "success" | "error";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const useWriterStore = defineStore("writer", () => {
  const fileName = ref("");
  const fileSize = ref(0);
  const requiredBytes = ref<number | null>(null);
  const currentJsonData = ref<string | null>(null);
  const playerUrl = ref(getDefaultPlayerUrl());
  const statusMessage = ref("");
  const statusType = ref<StatusType>("idle");
  const isWriting = ref(false);

  const hasData = computed(() => currentJsonData.value !== null);

  function setStatus(message: string, type: StatusType): void {
    statusMessage.value = message;
    statusType.value = type;
  }

  async function processMidiFile(file: File): Promise<void> {
    const lowerName = file.name.toLowerCase();
    if (
      !file.type.includes("audio/midi") &&
      !lowerName.endsWith(".mid") &&
      !lowerName.endsWith(".midi")
    ) {
      setStatus("MIDIファイルのみサポートしています", "error");
      return;
    }

    try {
      fileName.value = file.name;
      fileSize.value = file.size;
      setStatus("処理中...", "processing");

      const arrayBuffer = await file.arrayBuffer();
      const midi = new Midi(new Uint8Array(arrayBuffer));
      const serializedMidi = midi.toArray();
      const compressed = await gzipCompress(serializedMidi);
      const encoded = base64urlEncode(compressed);
      const jsonString = JSON.stringify({
        data: encoded,
        compression: "gzip",
      });

      currentJsonData.value = jsonString;
      requiredBytes.value = jsonString.length;
      setStatus("変換完了", "success");
    } catch (error: unknown) {
      setStatus(`エラー: ${toErrorMessage(error)}`, "error");
    }
  }

  async function writeToNfc(): Promise<void> {
    if (!currentJsonData.value) {
      setStatus("データがありません", "error");
      return;
    }

    try {
      isWriting.value = true;
      setStatus("NFCタグに接触してください...", "processing");
      await writeJsonToNfc(currentJsonData.value, playerUrl.value.trim() || getDefaultPlayerUrl());
      setStatus("NFCタグへの書き込みが完了しました", "success");
    } catch (error: unknown) {
      const errorName = error instanceof Error ? error.name : "";
      if (errorName === "NotSupportedError") {
        setStatus("Web NFC APIがこのブラウザで利用できません", "error");
      } else if (errorName === "NotAllowedError") {
        setStatus("NFCの使用許可が得られませんでした", "error");
      } else if (errorName === "AbortError") {
        setStatus("書き込みが中止されました", "processing");
      } else if (errorName === "NetworkError") {
        setStatus(
          "書き込みに失敗しました。タグの接触状態と容量を確認してください。",
          "error",
        );
      } else {
        setStatus(`エラー: ${toErrorMessage(error)}`, "error");
      }
    } finally {
      isWriting.value = false;
    }
  }

  return {
    currentJsonData,
    fileName,
    fileSize,
    hasData,
    isWriting,
    playerUrl,
    requiredBytes,
    statusMessage,
    statusType,
    processMidiFile,
    setStatus,
    writeToNfc,
  };
});