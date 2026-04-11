import { reactive } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PlayerView from "../../src/views/PlayerView.vue";

const playerViewMocks = vi.hoisted(() => ({
  loadMidiFromText: vi.fn(async () => {}),
  log: vi.fn(),
  startPlayback: vi.fn(async () => {}),
  stopPlayback: vi.fn(),
  stopScan: vi.fn(),
  startJsonNfcScan: vi.fn(),
  isWebNfcAvailable: vi.fn(() => true),
  applyTheme: vi.fn(),
}));

const storeState = reactive({
  isPlaying: false,
  logs: ["Page loaded"],
  midiReady: false,
  playbackReady: false,
  soundfontReady: false,
  summary: "Page loaded",
  trackDetails: "--",
  trackTitle: "MIDI Ready",
  instrumentSummary: "",
  usedInstruments: [] as string[],
  loadMidiFromText: playerViewMocks.loadMidiFromText,
  loadSoundfont: vi.fn(),
  log: playerViewMocks.log,
  startPlayback: playerViewMocks.startPlayback,
  stopPlayback: playerViewMocks.stopPlayback,
});

vi.mock("../../src/stores/playerStore", () => ({
  usePlayerStore: () => storeState,
}));

vi.mock("../../src/utils/nfcUtils", () => ({
  startJsonNfcScan: playerViewMocks.startJsonNfcScan,
  isWebNfcAvailable: playerViewMocks.isWebNfcAvailable,
}));

vi.mock("../../src/utils/themes", () => ({
  applyTheme: playerViewMocks.applyTheme,
}));

function mountPlayerView() {
  return mount(PlayerView, {
    global: {
      stubs: {
        RouterLink: {
          template: "<a><slot /></a>",
        },
      },
    },
  });
}

describe("PlayerView", () => {
  beforeEach(() => {
    storeState.isPlaying = false;
    storeState.logs = ["Page loaded"];
    storeState.midiReady = false;
    storeState.playbackReady = false;
    storeState.summary = "Page loaded";
    storeState.trackDetails = "--";
    storeState.trackTitle = "MIDI Ready";
    storeState.instrumentSummary = "";
    playerViewMocks.loadMidiFromText.mockClear();
    playerViewMocks.log.mockClear();
    playerViewMocks.startPlayback.mockClear();
    playerViewMocks.stopPlayback.mockClear();
    playerViewMocks.startJsonNfcScan.mockReset();
    playerViewMocks.isWebNfcAvailable.mockReturnValue(true);
    playerViewMocks.applyTheme.mockClear();
    playerViewMocks.stopScan.mockClear();
    playerViewMocks.startJsonNfcScan.mockImplementation(async ({ onStateChange }) => {
      onStateChange?.(true);
      return { stop: playerViewMocks.stopScan };
    });
  });

  it("starts NFC scanning and applies the default theme on mount", async () => {
    const wrapper = mountPlayerView();

    await wrapper.get("button").trigger("click");

    expect(playerViewMocks.applyTheme).toHaveBeenCalledWith("default", expect.any(Function));
    expect(playerViewMocks.startJsonNfcScan).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain("読み取りを停止");
  });

  it("disables scanning when Web NFC is unavailable", () => {
    playerViewMocks.isWebNfcAvailable.mockReturnValue(false);

    const wrapper = mountPlayerView();

    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
    expect(wrapper.text()).toContain("Web NFC Unsupported");
  });

  it("stops scanning and playback when unmounted", async () => {
    const wrapper = mountPlayerView();

    await wrapper.get("button").trigger("click");
    wrapper.unmount();

    expect(playerViewMocks.stopScan).toHaveBeenCalledTimes(1);
    expect(playerViewMocks.stopPlayback).toHaveBeenCalledTimes(1);
  });
});