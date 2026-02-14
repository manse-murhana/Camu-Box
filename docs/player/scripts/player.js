const elements = {
  logBox: document.getElementById("log"),
  logSummary: document.getElementById("logSummary"),
  playBtn: document.getElementById("playBtn"),
  stopBtn: document.getElementById("stopBtn"),
  playbackControls: document.getElementById("playbackControls"),
  trackInfo: document.getElementById("trackInfo"),
  trackTitle: document.getElementById("trackTitle"),
  trackDetails: document.getElementById("trackDetails"),
  nfcWarning: document.querySelector(".nfc-warning"),
};
const {
  logBox,
  logSummary,
  playBtn,
  stopBtn,
  playbackControls,
  trackInfo,
  trackTitle,
  trackDetails,
  nfcWarning,
} = elements;
const playerDataUtils = window.dataUtils;
const playerInstrumentNames = window.INSTRUMENT_NAMES;

let midiData = null;
let midiParsed = null;
let isPlaying = false;
let soundfontPlayer = null;
let playingNoteSequence = null;
let midiReady = false;
let soundfontReady = false;

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  logBox.textContent += logMessage + "\n";
  logBox.scrollTop = logBox.scrollHeight;

  // Display the latest log in the summary
  logSummary.textContent = message;
}

async function loadMidiFromText(text) {
  const midiInfo = playerDataUtils.extractMidiInfo(text);
  if (!midiInfo || !midiInfo.data)
    return log("NFC text does not contain MIDI data");

  try {
    // Reset state for new data
    if (isPlaying || playingNoteSequence) stopAudioPlayback();
    [midiReady, soundfontReady, soundfontPlayer, loadSoundfontPromise] = [
      false,
      false,
      null,
      null,
    ];
    // Hide controls during reset
    playbackControls.style.display = "none";
    updatePlayButtonState();

    log("Decoding Base64url");
    const compressed = playerDataUtils.base64urlDecode(midiInfo.data);
    log(`Compressed data: ${compressed.length} bytes`);

    // Check compression type from JSON
    const compressionType = midiInfo.compression || "lzma";
    let decompressPromise;
    if (compressionType === "gzip") {
      log("Decompressing Gzip");
      decompressPromise = playerDataUtils.gzipDecompress(compressed);
    } else {
      log("Decompressing LZMA");
      decompressPromise = playerDataUtils.lzmaDecompress(compressed);
    }

    midiData = await decompressPromise;
    log(`Decompressed data: ${midiData.length} bytes`);

    log("Parsing MIDI");
    midiParsed = new Midi(midiData.buffer);
    log(
      `Number of tracks: ${midiParsed.tracks.length}, length: ${midiParsed.duration.toFixed(2)}s`,
    );
    // Display track information
    trackInfo.style.display = "block";

    // Get MIDI title information and fix encoding
    //NOTE: Copyright information (composer) cannot be read due to library limitations
    const midiTitle =
      playerDataUtils.detectAndDecodeText(midiParsed.header?.name) || "MIDI Ready";
    trackTitle.textContent = midiTitle;

    const minutes = Math.floor(midiParsed.duration / 60);
    const seconds = Math.floor(midiParsed.duration % 60);
    trackDetails.textContent = `${midiParsed.tracks.length} tracks | ${minutes}:${seconds.toString().padStart(2, "0")}`;
    midiReady = true;
    // Show controls when MIDI is ready
    playbackControls.style.display = "flex";
    updatePlayButtonState();

    // Start downloading soundfont after MIDI load is complete
    loadSoundfont();
  } catch (err) {
    console.error(err);
    log("Error: " + err.message);
  }
}

let loadSoundfontPromise = null;

async function loadSoundfont() {
  if (soundfontPlayer) return soundfontPlayer;
  if (loadSoundfontPromise) return loadSoundfontPromise;

  loadSoundfontPromise = (async () => {
    try {
      // Collect used instruments
      const activeTracks = midiParsed.tracks.filter((t) => t.notes.length > 0);
      const hasDrums = activeTracks.some((t) => t.channel === 9);
      const instrumentList = [
        ...new Set(
          activeTracks
            .filter((t) => t.channel !== 9)
            .map((t) => t.instrument?.number ?? 0),
        ),
      ].sort((a, b) => a - b);

      const instrumentDisplayList = [
        ...instrumentList.map((num) => playerInstrumentNames[num] || "Unknown"),
        ...(hasDrums ? ["Drums"] : []),
      ];
      const totalSounds = instrumentList.length + (hasDrums ? 1 : 0);

      log(`Downloading soundfont... (${totalSounds} sounds)`);
      log(`Used instruments: ${instrumentDisplayList.join(", ")}`);

      // Initialize Magenta.js SoundFont Player
      soundfontPlayer = new mm.SoundFontPlayer(
        "https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus",
      );

      // Load samples for used instruments
      await soundfontPlayer.loadSamples(convertToNoteSequence(midiParsed));

      log("Soundfont download completed");
      soundfontReady = true;
      updatePlayButtonState();
      return soundfontPlayer;
    } catch (err) {
      log("Failed to load SoundFont: " + err.message);
      throw err;
    }
  })();
  return loadSoundfontPromise;
}

function setPlayState(playing) {
  isPlaying = playing;
  playBtn.disabled = playing || !(midiReady && soundfontReady);
  stopBtn.disabled = !playing;
  // 再生コントロール全体の表示/非表示を制御
  playbackControls.style.display = midiReady ? "flex" : "none";
  if (nfcWarning) nfcWarning.style.display = midiReady ? "none" : "block";
}

function updatePlayButtonState() {
  const wasDisabled = playBtn.disabled;
  setPlayState(isPlaying);
  if (wasDisabled && !playBtn.disabled) log("Ready to play!");
}

function convertToNoteSequence(midiParsed) {
  const notes = midiParsed.tracks.flatMap((track) => {
    const instrument = track.instrument?.number ?? 0;
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
  const totalTime = Math.max(0, ...notes.map((n) => n.endTime));
  return { notes, totalTime };
}

async function playWithAudio() {
  if (!midiParsed) return log("MIDI data is not loaded yet");

  const player = await loadSoundfont();
  if (isPlaying || playingNoteSequence) stopAudioPlayback();

  log("Playing");
  setPlayState(true);

  try {
    playingNoteSequence = player.start(convertToNoteSequence(midiParsed));
    playingNoteSequence
      ?.then?.(() => {
        playingNoteSequence = null;
        setPlayState(false);
        log("Playback completed");
      })
      .catch?.((err) => {
        if (err.message !== "cancelled") log("Playback error: " + err.message);
        setPlayState(false);
      });
  } catch (err) {
    log("Playback error: " + err.message);
    setPlayState(false);
  }
}

function stopAudioPlayback() {
  soundfontPlayer?.stop?.();
  playingNoteSequence = null;
  setPlayState(false);
  log("Stopped");
}

playBtn.addEventListener("click", playWithAudio);
stopBtn.addEventListener("click", stopAudioPlayback);

log("Page loaded");

window.playerApi = {
  loadMidiFromText,
  log,
};
