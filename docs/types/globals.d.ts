type MidiTrackNote = {
  midi: number;
  time: number;
  duration: number;
  velocity?: number;
};

type MidiTrack = {
  notes: MidiTrackNote[];
  channel: number;
  instrument?: {
    number?: number;
  };
};

type MidiHeader = {
  name?: string;
};

type MidiInstance = {
  tracks: MidiTrack[];
  duration: number;
  header?: MidiHeader;
  toArray(): Uint8Array;
};

type MidiConstructor = new (input: ArrayBuffer | Uint8Array) => MidiInstance;

declare const Midi: MidiConstructor;

type SoundFontPlayer = {
  loadSamples(noteSequence: { notes: NoteEvent[]; totalTime: number }): Promise<void>;
  start(noteSequence: { notes: NoteEvent[]; totalTime: number }): Promise<void>;
  stop(): void;
};

type MagentaNamespace = {
  SoundFontPlayer: new (soundFontUrl: string) => SoundFontPlayer;
};

declare const mm: MagentaNamespace;

declare const LZMA: {
  decompress(
    data: number[],
    callback: (result: number[] | Uint8Array, error?: unknown) => void,
  ): void;
};

type MidiInfo = {
  data: string;
  compression?: string;
};

type DataUtils = {
  isAsciiOnly(text: string): boolean;
  countControlChars(text: string): number;
  base64urlDecode(str: string): Uint8Array;
  detectAndDecodeText(text?: string): string | undefined;
  ensureLzmaDecoderLoaded(): Promise<void>;
  ensureDecompressionStreamSupported(): void;
  lzmaDecompress(compressed: Uint8Array): Promise<Uint8Array>;
  gzipDecompress(compressed: Uint8Array): Promise<Uint8Array>;
  extractMidiFromText(text?: string): string | null;
  extractMidiInfo(text?: string): MidiInfo | null;
};

type NoteEvent = {
  pitch: number;
  startTime: number;
  endTime: number;
  velocity: number;
  program?: number;
  isDrum: boolean;
};

type DomUtils = {
  requireElement<T extends Element>(id: string, ctor: { new (): T }): T;
  getElementById<T extends Element>(id: string, ctor: { new (): T }): T | null;
  getElementByClass<T extends Element>(
    selector: string,
    ctor: { new (): T },
  ): T | null;
};

type ErrorUtils = {
  toMessage(error: unknown): string;
  getName(error: unknown): string;
};

declare class NDEFReader {
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  write(message: { records: Array<Record<string, unknown>> }): Promise<void>;
  onreading: ((event: { message: NDEFMessage }) => void) | null;
  onerror: ((error: Error) => void) | null;
}

type NDEFRecordLike = {
  mediaType?: string;
  data?: BufferSource;
};

type NDEFMessage = {
  records: NDEFRecordLike[];
};

type CommonUtils = DomUtils & ErrorUtils;

type WindowProps = {
  commonUtils?: CommonUtils;
  dataUtils?: DataUtils;
  INSTRUMENT_NAMES?: string[];
  playerApi?: {
    loadMidiFromText?: (text: string) => Promise<void>;
    log?: (message: string) => void;
  };
  themes?: Record<string, Record<string, string>>;
  applyTheme?: (themeName: string, logCallback?: (message: string) => void) => void;
};

interface Window extends WindowProps {
}