import { afterEach } from "vitest";
import { config } from "@vue/test-utils";

config.global.stubs = {
  transition: false,
  teleport: true,
};

afterEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});