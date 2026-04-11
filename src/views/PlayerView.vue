<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import { usePlayerStore } from "../stores/playerStore";
import { startJsonNfcScan, type NfcScanSession, isWebNfcAvailable } from "../utils/nfcUtils";
import { applyTheme } from "../utils/themes";

const store = usePlayerStore();
const scanning = ref(false);
const nfcSupported = computed(() => isWebNfcAvailable());
const scanButtonLabel = computed(() => (scanning.value ? "読み取りを停止" : "タグを読み取る"));
let scanSession: NfcScanSession | null = null;

async function startScan(): Promise<void> {
  if (scanning.value) {
    return;
  }

  try {
    scanSession = await startJsonNfcScan({
      onLog: (message) => store.log(message),
      onJsonPayload: async (jsonText) => {
        await store.loadMidiFromText(jsonText);
      },
      onStateChange: (active) => {
        scanning.value = active;
      },
      stopAfterSuccessMs: 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    scanning.value = false;
    store.log(`NFC scan failed: ${message}`);
  }
}

function stopScan(): void {
  scanSession?.stop();
  scanSession = null;
}

async function toggleScan(): Promise<void> {
  if (scanning.value) {
    stopScan();
    return;
  }

  await startScan();
}

onMounted(() => {
  applyTheme("default", (message) => store.log(message));
});

onBeforeUnmount(() => {
  stopScan();
  store.stopPlayback();
});
</script>

<template>
  <section class="page page-player">
    <div class="player-legacy-shell">
      <div class="panel player-panel player-panel-legacy">
        <div class="player-header">
          <h1>🎵 Camu-Box Player</h1>
          <p class="subtitle">
            NFCタグを読み取り、書き込まれた音楽を再生します。
          </p>
          <p class="nfc-hint" :class="nfcSupported ? 'ok' : 'warning'">
            {{ nfcSupported ? "Web NFC Ready" : "Web NFC Unsupported" }}
          </p>
        </div>

        <div class="controls nfc-controls">
          <button
            :class="['nfc-start-btn', scanning ? 'secondary-button' : 'primary-button', { 'scan-active': scanning }]"
            :disabled="!nfcSupported"
            @click="toggleScan"
          >
            {{ scanButtonLabel }}
          </button>
          <p class="nfc-warning">
            利用前に <a href="./terms.html" target="_blank" rel="noopener">規約</a>
            を確認してください。
          </p>
        </div>

        <div v-if="store.midiReady" class="track-card track-info">
          <div class="track-title">{{ store.trackTitle }}</div>
          <div class="track-details">{{ store.trackDetails }}</div>
          <div v-if="store.instrumentSummary" class="track-instruments">
            {{ store.instrumentSummary }}
          </div>
        </div>

        <div v-if="store.midiReady" class="controls playback-controls">
          <button class="primary-button playback-button" :disabled="!store.playbackReady" @click="store.startPlayback">
            ▶
          </button>
          <button class="danger-button playback-button" :disabled="!store.isPlaying" @click="store.stopPlayback">
            ⏹
          </button>
        </div>

        <details class="log-container" open>
          <summary>{{ store.summary }}</summary>
          <pre class="log-output">{{ store.logs.join("\n") }}</pre>
        </details>
      </div>
    </div>
  </section>
</template>