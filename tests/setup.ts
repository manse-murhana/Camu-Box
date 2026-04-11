import { afterEach } from "vitest";
import { config } from "@vue/test-utils";
import BasePanel from "../src/components/BasePanel.vue";
import BaseCard from "../src/components/BaseCard.vue";

config.global.components = {
  BasePanel,
  BaseCard,
};

config.global.stubs = {
  transition: false,
  teleport: true,
};

afterEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});