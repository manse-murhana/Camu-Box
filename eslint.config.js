const js = require("@eslint/js");
const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
  js.configs.recommended,
  {
    ignores: ["**/node_modules/**"],
  },
  {
    files: ["docs/**/scripts/*.js"],
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
  {
    files: ["docs/**/scripts/*.ts"],
    languageOptions: {
      parser: tsParser,
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
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
];
