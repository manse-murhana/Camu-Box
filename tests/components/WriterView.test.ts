import { reactive } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WriterView from "../../src/views/WriterView.vue";

const writerViewMocks = vi.hoisted(() => ({
  processMidiFile: vi.fn(async () => {}),
  setCompressionType: vi.fn(async () => {}),
  writeToNfc: vi.fn(async () => {}),
}));

const storeState = reactive({
  compressionType: "lzma",
  fileName: "",
  fileSize: 0,
  hasData: false,
  isWriting: false,
  requiredBytes: null as number | null,
  statusMessage: "",
  statusType: "idle",
  processMidiFile: writerViewMocks.processMidiFile,
  setCompressionType: writerViewMocks.setCompressionType,
  writeToNfc: writerViewMocks.writeToNfc,
  setStatus: vi.fn(),
});

vi.mock("../../src/stores/writerStore", () => ({
  useWriterStore: () => storeState,
}));

describe("WriterView", () => {
  beforeEach(() => {
    storeState.compressionType = "lzma";
    storeState.fileName = "";
    storeState.fileSize = 0;
    storeState.hasData = false;
    storeState.isWriting = false;
    storeState.requiredBytes = null;
    storeState.statusMessage = "";
    storeState.statusType = "idle";
    writerViewMocks.processMidiFile.mockClear();
    writerViewMocks.setCompressionType.mockClear();
    writerViewMocks.writeToNfc.mockClear();
  });

  it("passes the selected file to the store", async () => {
    const wrapper = mount(WriterView);
    const file = new File([Uint8Array.from([1, 2, 3])], "song.mid", { type: "audio/midi" });
    const input = wrapper.get("input[type='file']");

    Object.defineProperty(input.element, "files", {
      value: [file],
      configurable: true,
    });
    await input.trigger("change");

    expect(writerViewMocks.processMidiFile).toHaveBeenCalledWith(file);
  });

  it("updates the compression type and forwards NFC writes", async () => {
    const wrapper = mount(WriterView);
    storeState.hasData = true;

    await wrapper.get("input[value='gzip']").setValue(true);
    await wrapper.get("button.danger-button").trigger("click");

    expect(writerViewMocks.setCompressionType).toHaveBeenCalledWith("gzip");
    expect(writerViewMocks.writeToNfc).toHaveBeenCalledTimes(1);
  });
});