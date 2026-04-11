import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    ignores: ["**/node_modules/**"],
  },
  {
    files: ["src/**/*.ts", "vite.config.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        Midi: "readonly",
        mm: "readonly",
        LZMA: "readonly",
        NDEFReader: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAsExpression",
          message: "Type assertion using 'as' is forbidden.",
        },
      ],
    },
  },
];
