// eslint.config.mjs
import globals from "globals";
import json from "@eslint/json";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

const readonlyGlobals = Object.fromEntries(Object.keys(globals.browser).map((k) => [k, "readonly"]));

export default defineConfig([
   {
      ignores: ["module/**", "node_modules/**", "**/*.min.js", "package-lock.json", "scripts/build/**"],
   },
   ...tseslint.configs.recommended,
   {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
         parser: tseslint.parser,
         parserOptions: {
            project: "./tsconfig.json",
            tsconfigRootDir: import.meta.dirname,
         },
         globals: {
            ...readonlyGlobals,
            game: "readonly",
            foundry: "readonly",
            CONFIG: "readonly",
            CONST: "readonly",
            Hooks: "readonly",
            ui: "readonly",
         },
      },
      rules: {
         "@typescript-eslint/explicit-module-boundary-types": "off",
         "no-unused-vars": "off",
         "@typescript-eslint/no-unused-vars": [
            "error",
            {
               argsIgnorePattern: "^_",
               varsIgnorePattern: "^_",
               caughtErrorsIgnorePattern: "^_",
            },
         ],
      },
   },
   {
      files: ["**/*.json"],
      plugins: { json },
      language: "json/json",
      extends: ["json/recommended"],
   },
]);
