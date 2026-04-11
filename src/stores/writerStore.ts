import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { Midi } from "@tonejs/midi";

import type { CompressionType } from "../types/web-music";

import { base64urlEncode, gzipCompress, lzmaCompress } from "../utils/dataUtils";
import { writeJsonToNfc } from "../utils/nfcUtils";
import { getDefaultPlayerUrl } from "../utils/playerUrl";

type StatusType = "idle" | "processing" | "success" | "error";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const useWriterStore = defineStore("writer", () => {
  const compressionType = ref<CompressionType>("lzma");
  const fileName = ref("");
  const fileSize = ref(0);
  const requiredBytes = ref<number | null>(null);
  const currentJsonData = ref<string | null>(null);
  const sourceMidiBytes = ref<number[] | null>(null);
  const statusMessage = ref("");
  const statusType = ref<StatusType>("idle");
  const isWriting = ref(false);

  const hasData = computed(() => currentJsonData.value !== null);

  function setStatus(message: string, type: StatusType): void {
    statusMessage.value = message;
    statusType.value = type;
  }

  async function createJsonData(serializedMidi: Uint8Array): Promise<string> {
    const compressed =
      compressionType.value === "gzip"
        ? await gzipCompress(serializedMidi)
        : await lzmaCompress(serializedMidi);
    const encoded = base64urlEncode(compressed);
    return JSON.stringify({
      data: encoded,
      compression: compressionType.value,
    });
  }

  async function refreshJsonData(): Promise<void> {
    if (!sourceMidiBytes.value) {
      currentJsonData.value = null;
      requiredBytes.value = null;
      return;
    }

    const jsonString = await createJsonData(Uint8Array.from(sourceMidiBytes.value));
    currentJsonData.value = jsonString;
    requiredBytes.value = jsonString.length;
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
      sourceMidiBytes.value = Array.from(midi.toArray());
      await refreshJsonData();
      setStatus("変換完了", "success");
    } catch (error: unknown) {
      setStatus(`エラー: ${toErrorMessage(error)}`, "error");
    }
  }

  async function setCompressionType(nextCompressionType: CompressionType): Promise<void> {
    if (compressionType.value === nextCompressionType) {
      return;
    }

    compressionType.value = nextCompressionType;
    if (!sourceMidiBytes.value) {
      return;
    }

    try {
      setStatus("再圧縮中...", "processing");
      await refreshJsonData();
      setStatus("圧縮形式を更新しました", "success");
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
      await writeJsonToNfc(currentJsonData.value, getDefaultPlayerUrl());
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
    compressionType,
    currentJsonData,
    fileName,
    fileSize,
    hasData,
    isWriting,
    requiredBytes,
    setCompressionType,
    statusMessage,
    statusType,
    processMidiFile,
    setStatus,
    writeToNfc,
  };
});