import { computed, type ComputedRef } from "vue";

import { isWebNfcAvailable } from "../utils/nfcUtils";

export type WebNfcSupport = {
  nfcSupported: ComputedRef<boolean>;
  nfcSupportMessage: ComputedRef<string>;
};

export function useWebNfcSupport(): WebNfcSupport {
  const nfcSupported = computed(() => isWebNfcAvailable());
  const nfcSupportMessage = computed(() =>
    nfcSupported.value
      ? "このブラウザで利用可能です"
      : "Android, Google Chromeにのみ対応しています",
  );

  return { nfcSupported, nfcSupportMessage };
}
