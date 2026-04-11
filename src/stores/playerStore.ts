import { computed, ref, shallowRef } from "vue";
import { defineStore } from "pinia";
import { Midi } from "@tonejs/midi";
import { SoundFontPlayer } from "@magenta/music";

import {
  MAX_COMPRESSED_MIDI_BYTES,
  MAX_DECOMPRESSED_MIDI_BYTES,
  MAX_DECOMPRESSION_RATIO,
  base64urlDecode,
  detectAndDecodeText,
  gzipDecompress,
  lzmaDecompress,
  validateMidiInfo,
} from "../utils/dataUtils";
import { INSTRUMENT_NAMES } from "../utils/instruments";
import type { NoteEvent, NoteSequence, SoundFontPlayerLike } from "../types/web-music";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const usePlayerStore = defineStore("player", () => {
  const midiData = ref<Uint8Array | null>(null);
  const midiParsed = shallowRef<Midi | null>(null);
  const isPlaying = ref(false);
  const soundfontReady = ref(false);
  const logs = ref<string[]>(["Page loaded"]);
  const usedInstruments = ref<string[]>([]);
  const soundfontPlayer = shallowRef<SoundFontPlayerLike | null>(null);
  const playingNoteSequence = ref<Promise<void> | null>(null);
  const loadSoundfontPromise = ref<Promise<SoundFontPlayerLike> | null>(null);

  const summary = computed(() => logs.value.at(-1) ?? "Initializing...");
  const midiReady = computed(() => midiParsed.value !== null);
  const playbackReady = computed(() => midiReady.value && soundfontReady.value && !isPlaying.value);
  const trackTitle = computed(() => {
    const title = detectAndDecodeText(midiParsed.value?.header?.name);
    return title || "MIDI Ready";
  });
  const trackDetails = computed(() => {
    if (!midiParsed.value) {
      return "--";
    }
    const minutes = Math.floor(midiParsed.value.duration / 60);
    const seconds = Math.floor(midiParsed.value.duration % 60);
    return `${midiParsed.value.tracks.length} tracks | ${minutes}:${seconds.toString().padStart(2, "0")}`;
  });
  const instrumentSummary = computed(() => {
    if (!usedInstruments.value.length) {
      return "";
    }
    return usedInstruments.value.join(", ");
  });

  function log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    logs.value.push(`[${timestamp}] ${message}`);
  }

  function convertToNoteSequence(parsedMidi: Midi): NoteSequence {
    const notes: NoteEvent[] = parsedMidi.tracks.flatMap((track) => {
      const instrument = track.instrument.number;
      const isDrum = track.channel === 9;

      return track.notes.map((note) => ({
        pitch: note.midi,
        startTime: note.time,
        endTime: note.time + note.duration,
        velocity: Math.round((note.velocity || 0.8) * 127),
        program: isDrum ? undefined : instrument,
        isDrum,
      }));
    });

    const totalTime = Math.max(0, ...notes.map((note) => note.endTime));
    return { notes, totalTime };
  }

  async function loadSoundfont(): Promise<SoundFontPlayerLike> {
    if (!midiParsed.value) {
      throw new Error("MIDI data is not loaded yet");
    }
    const parsedMidi = midiParsed.value;
    if (soundfontPlayer.value) {
      return soundfontPlayer.value;
    }
    if (loadSoundfontPromise.value) {
      return loadSoundfontPromise.value;
    }

    loadSoundfontPromise.value = (async () => {
      const activeTracks = parsedMidi.tracks.filter((track) => track.notes.length > 0);
      const hasDrums = activeTracks.some((track) => track.channel === 9);
      const instrumentList = [
        ...new Set(
          activeTracks
            .filter((track) => track.channel !== 9)
            .map((track) => Number(track.instrument.number ?? 0)),
        ),
      ].sort((left, right) => left - right);
      usedInstruments.value = [
        ...instrumentList.map((number) => INSTRUMENT_NAMES[number] || "Unknown"),
        ...(hasDrums ? ["Drums"] : []),
      ];

      const player = new SoundFontPlayer(
        "https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus",
      );

      log("Downloading soundfont...");
      if (usedInstruments.value.length > 0) {
        log(`Used instruments: ${usedInstruments.value.join(", ")}`);
      }
      await player.loadSamples(convertToNoteSequence(parsedMidi));
      soundfontPlayer.value = player;
      soundfontReady.value = true;
      log("Soundfont download completed");
      return player;
    })();

    return loadSoundfontPromise.value;
  }

  async function loadMidiFromText(text: string): Promise<void> {
    const { midiInfo, error } = validateMidiInfo(text);
    if (!midiInfo) {
      log(`NFC text rejected: ${error ?? "invalid MIDI payload"}`);
      return;
    }

    try {
      stopPlayback();
      soundfontReady.value = false;
      soundfontPlayer.value = null;
      loadSoundfontPromise.value = null;
      usedInstruments.value = [];

      log("Decoding Base64url");
      const compressed = base64urlDecode(midiInfo.data);
      if (compressed.length > MAX_COMPRESSED_MIDI_BYTES) {
        throw new Error(`Compressed payload exceeds ${MAX_COMPRESSED_MIDI_BYTES} bytes`);
      }
      log(`Compressed data: ${compressed.length} bytes`);

      let decompressed: Uint8Array;
      if (midiInfo.compression === "gzip") {
        decompressed = await gzipDecompress(compressed);
      } else {
        decompressed = await lzmaDecompress(compressed);
      }

      if (decompressed.length > MAX_DECOMPRESSED_MIDI_BYTES) {
        throw new Error(`Decompressed payload exceeds ${MAX_DECOMPRESSED_MIDI_BYTES} bytes`);
      }

      if (compressed.length > 0 && decompressed.length / compressed.length > MAX_DECOMPRESSION_RATIO) {
        throw new Error(`Decompression ratio exceeds ${MAX_DECOMPRESSION_RATIO}x`);
      }

      midiData.value = decompressed;
      log(`Decompressed data: ${decompressed.length} bytes`);

      midiParsed.value = new Midi(decompressed);
      log(
        `Number of tracks: ${midiParsed.value.tracks.length}, length: ${midiParsed.value.duration.toFixed(2)}s`,
      );
      void loadSoundfont();
    } catch (error: unknown) {
      log(`Error: ${toErrorMessage(error)}`);
    }
  }

  async function startPlayback(): Promise<void> {
    if (!midiParsed.value) {
      log("MIDI data is not loaded yet");
      return;
    }

    const player = await loadSoundfont();
    stopPlayback();
    log("Playing");
    isPlaying.value = true;

    try {
      const sequence = convertToNoteSequence(midiParsed.value);
      playingNoteSequence.value = player.start(sequence);
      await playingNoteSequence.value;
      log("Playback completed");
    } catch (error: unknown) {
      if (toErrorMessage(error) !== "cancelled") {
        log(`Playback error: ${toErrorMessage(error)}`);
      }
    } finally {
      playingNoteSequence.value = null;
      isPlaying.value = false;
    }
  }

  function stopPlayback(): void {
    soundfontPlayer.value?.stop();
    playingNoteSequence.value = null;
    if (isPlaying.value) {
      log("Stopped");
    }
    isPlaying.value = false;
  }

  return {
    isPlaying,
    logs,
    midiData,
    midiReady,
    playbackReady,
    soundfontReady,
    summary,
    trackDetails,
    trackTitle,
    instrumentSummary,
    usedInstruments,
    loadMidiFromText,
    loadSoundfont,
    log,
    startPlayback,
    stopPlayback,
  };
});