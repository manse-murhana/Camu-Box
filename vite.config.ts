import { defineConfig, type ConfigEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import basicSsl from "@vitejs/plugin-basic-ssl";

export function createAppConfig({ mode }: ConfigEnv) {
  return {
    plugins: [vue(), basicSsl()],
    base: mode === "production" ? "/Camu-Box/" : "/",
    define: {
      global: "globalThis",
    },
    resolve: {
      alias: {
        buffer: "buffer",
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: "globalThis",
        },
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
    },
  };
}

export default defineConfig(createAppConfig);