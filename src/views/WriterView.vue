<script setup lang="ts">
import { ref } from "vue";

import type { CompressionType } from "../types/web-music";
import { useWriterStore } from "../stores/writerStore";

const store = useWriterStore();
const inputRef = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);

async function onCompressionChange(event: Event): Promise<void> {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  await store.setCompressionType(target.value as CompressionType);
}

async function handleFile(file: File | null): Promise<void> {
  if (!file) {
    return;
  }
  await store.processMidiFile(file);
}

async function onFileInput(event: Event): Promise<void> {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }
  await handleFile(target.files?.[0] ?? null);
}

async function onDrop(event: DragEvent): Promise<void> {
  event.preventDefault();
  dragOver.value = false;
  await handleFile(event.dataTransfer?.files?.[0] ?? null);
}
</script>

<template>
  <section class="page page-writer">
    <BasePanel>
      <div class="player-header">
        <h1>📝 Camu-Box Writer</h1>
        <p class="subtitle">
          MIDI ファイルをNFC タグに書き込み、Player で再生できるようにします。
        </p>
      </div>

      <button
        class="upload-area"
        :class="{ 'drag-over': dragOver }"
        type="button"
        @click="inputRef?.click()"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop="onDrop"
      >
        <span class="upload-icon">MIDI</span>
        <strong>ファイルを選択</strong>
        <small>クリックまたはドラッグ＆ドロップ</small>
      </button>

      <input ref="inputRef" class="hidden-input" type="file" accept=".mid,.midi" @change="onFileInput" />

      <div v-if="store.fileName" class="info-grid">
        <div class="info-item">
          <span>ファイル名</span>
          <strong>{{ store.fileName }}</strong>
        </div>
        <div class="info-item">
          <span>サイズ</span>
          <strong>{{ (store.fileSize / 1024).toFixed(2) }} KB</strong>
        </div>
      </div>

      <label class="field-group">
        <span>圧縮形式</span>
        <div class="radio-group" role="radiogroup" aria-label="圧縮形式">
          <label class="radio-option">
            <input
              type="radio"
              name="compressionType"
              value="gzip"
              :checked="store.compressionType === 'gzip'"
              :disabled="store.isWriting"
              @change="onCompressionChange"
            />
            <span>gzip</span>
          </label>
          <label class="radio-option">
            <input
              type="radio"
              name="compressionType"
              value="lzma"
              :checked="store.compressionType === 'lzma'"
              :disabled="store.isWriting"
              @change="onCompressionChange"
            />
            <span>lzma</span>
          </label>
        </div>
      </label>

      <div v-if="store.statusType !== 'idle'" class="status-box" :class="store.statusType">
        {{ store.statusMessage }}
      </div>

      <BaseCard v-if="store.hasData" class="result-card" gradient>
        <span>圧縮形式</span>
        <strong>{{ store.compressionType }}</strong>
        <span>必要な容量</span>
        <strong>{{ store.requiredBytes }} bytes</strong>
      </BaseCard>

      <div class="action-row">
        <button class="danger-button" :disabled="!store.hasData || store.isWriting" @click="store.writeToNfc">
          {{ store.isWriting ? "書き込み中..." : "NFC に書き込み" }}
        </button>
      </div>
    </BasePanel>
  </section>
</template>