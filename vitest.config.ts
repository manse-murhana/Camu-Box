import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

import { createAppConfig } from "./vite.config";

export default mergeConfig(
  defineConfig(createAppConfig({ command: "serve", mode: "test", isSsrBuild: false, isPreview: false })),
  defineConfig({
    resolve: {
      alias: {
        "@magenta/music": fileURLToPath(new URL("./tests/mocks/magentaMusic.ts", import.meta.url)),
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./tests/setup.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "html"],
        include: ["src/**/*.{ts,vue}"],
        exclude: [
          ...configDefaults.exclude,
          "src/env.d.ts",
          "src/main.ts",
          "src/polyfills.ts",
        ],
      },
    },
  }),
);