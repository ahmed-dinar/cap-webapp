import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import tsParser from '@typescript-eslint/parser';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  eslintPluginPrettierRecommended,
  {
    settings: {
      react: {
        version: 'detect',
      }
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      eqeqeq: "error",
      semi: ["error", "always"],
      "react/react-in-jsx-scope": "off",
      '@typescript-eslint/no-explicit-any': 'error',
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true,
          allowTernary: true,
        },
      ],
    },
  }
];

export default eslintConfig;
