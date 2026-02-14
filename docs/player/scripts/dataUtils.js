const dataUtils = {
  isAsciiOnly(text) {
    for (const char of text) {
      if (char.charCodeAt(0) > 0x7f) return false;
    }
    return true;
  },

  countControlChars(text) {
    let count = 0;
    for (const char of text) {
      const code = char.charCodeAt(0);
      if ((code >= 0x00 && code <= 0x1f) || code === 0x7f) {
        count += 1;
      }
    }
    return count;
  },

  base64urlDecode(str) {
    const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  },

  detectAndDecodeText(text) {
    if (!text) return text;
    if (dataUtils.isAsciiOnly(text)) return text;
    try {
      const bytes = new Uint8Array(text.split("").map((c) => c.charCodeAt(0)));
      const decoded = new TextDecoder("shift-jis").decode(bytes);
      const controlChars = dataUtils.countControlChars(decoded);
      if (controlChars / decoded.length < 0.1) return decoded;
    } catch (error) {
      void error;
    }
    return text;
  },

  ensureLzmaDecoderLoaded() {
    if (typeof LZMA !== "undefined") return Promise.resolve();
    if (!dataUtils.ensureLzmaDecoderLoaded._promise) {
      dataUtils.ensureLzmaDecoderLoaded._promise = new Promise(
        (resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/lzma@2.3.2/src/lzma-d-min.js";
          script.integrity =
            "sha384-4BkcOPZ+8zFWl78EIHW2NTkSdJgTDZ0qqtlDIZL2fcnRn7oHgUmCw17LSKVJIxCs";
          script.async = true;
          script.crossOrigin = "anonymous";
          script.onload = () =>
            typeof LZMA !== "undefined"
              ? resolve()
              : reject(new Error("LZMA load failed"));
          script.onerror = () =>
            reject(new Error("Failed to load LZMA script"));
          document.head.appendChild(script);
        },
      );
    }
    return dataUtils.ensureLzmaDecoderLoaded._promise;
  },

  ensureDecompressionStreamSupported() {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("DecompressionStream is not supported in this browser");
    }
  },

  async lzmaDecompress(compressed) {
    await dataUtils.ensureLzmaDecoderLoaded();
    return new Promise((resolve, reject) => {
      LZMA.decompress(Array.from(compressed), (result, error) => {
        if (error) reject(new Error("LZMA decoding failed: " + error));
        else resolve(new Uint8Array(result));
      });
    });
  },

  async gzipDecompress(compressed) {
    dataUtils.ensureDecompressionStreamSupported();
    try {
      const ds = new DecompressionStream("gzip");
      const stream = new Blob([compressed]).stream().pipeThrough(ds);
      const buffer = await new Response(stream).arrayBuffer();
      return new Uint8Array(buffer);
    } catch (err) {
      throw new Error("Gzip decoding failed: " + err.message);
    }
  },

  extractMidiFromText(text) {
    const trimmed = text?.trim();
    if (!trimmed) return null;
    try {
      const midiParam = new URL(trimmed).searchParams.get("midi");
      if (midiParam) return midiParam;
    } catch (error) {
      void error;
    }
    const match = trimmed.match(/midi=([^\s&#?]+)/);
    return match ? match[1] : trimmed;
  },

  extractMidiInfo(text) {
    const trimmed = text?.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed?.data) {
        return {
          data: parsed.data,
          compression: parsed.compression || undefined,
        };
      }
    } catch (error) {
      void error;
    }

    return null;
  },
};

window.dataUtils = dataUtils;
