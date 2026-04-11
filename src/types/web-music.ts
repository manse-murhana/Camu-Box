export type MidiInfo = {
  data: string;
  compression?: string;
};

export type NoteEvent = {
  pitch: number;
  startTime: number;
  endTime: number;
  velocity: number;
  program?: number;
  isDrum: boolean;
};

export type NoteSequence = {
  notes: NoteEvent[];
  totalTime: number;
};

export type SoundFontPlayerLike = {
  loadSamples(noteSequence: NoteSequence): Promise<void>;
  start(noteSequence: NoteSequence): Promise<void>;
  stop(): void;
};

export type NdefRecordLike = {
  mediaType?: string;
  data?: BufferSource;
};

export type NdefMessageLike = {
  records: NdefRecordLike[];
};

declare global {
  const LZMA:
    | {
        compress(
          data: number[],
          mode: number,
          callback: (result: number[] | Uint8Array | null, error?: unknown) => void,
        ): void;
        decompress(
          data: number[],
          callback: (result: number[] | Uint8Array, error?: unknown) => void,
        ): void;
      }
    | undefined;

  class NDEFReader {
    scan(options?: { signal?: AbortSignal }): Promise<void>;
    write(message: { records: Array<Record<string, unknown>> }): Promise<void>;
    onreading: ((event: { message: NdefMessageLike }) => void) | null;
    onerror: ((error: Error) => void) | null;
  }
}

export {};