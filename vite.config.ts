import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => ({
  plugins: [vue(), basicSsl()],
  base: mode === "production" ? "/Camu-Box/" : "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
}));