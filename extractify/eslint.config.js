/**
 * ESLint Configuration for Extractify
 *
 * This configuration provides a comprehensive linting setup for a web application
 * built with React and TypeScript. It integrates with Prettier for consistent
 * code formatting.
 *
 * @fileoverview ESLint configuration for a React, TypeScript, and Prettier stack.
 * @author Extractify Development Team
 * @version 1.1.0
 */

import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import pluginPrettier from "eslint-plugin-prettier";
import configPrettier from "eslint-config-prettier";

/**
 * ESLint Configuration Array
 *
 * @type {Array<Object>}
 */
export default [
  /**
   * Global Configuration
   */
  {
    ignores: ["dist", ".vite", "node_modules"],
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },

  /**
   * Renderer Process (Web App) Configuration
   */
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": pluginReactHooks,
      "react-refresh": pluginReactRefresh,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },

  /**
   * TypeScript and React Common Configuration
   */
  {
    files: ["**/*.{ts,tsx}"],
    ...pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginReactConfig,
    ...configPrettier,
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "react/react-in-jsx-scope": "off",
    },
  },
];