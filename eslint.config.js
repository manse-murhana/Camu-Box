const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    ignores: ["**/node_modules/**"],
  },
  {
    files: ["docs/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        Midi: "readonly",
        mm: "readonly",
        LZMA: "readonly",
        NDEFReader: "readonly",
      },
    },
  },
];
