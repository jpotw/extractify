/**
 * ESLint Configuration for Extractify
 * 
 * This configuration provides a comprehensive linting setup for an Electron application
 * with React frontend and TypeScript support. It includes separate configurations
 * for different parts of the application (main process, renderer process) and
 * integrates with Prettier for consistent code formatting.
 * 
 * @fileoverview ESLint configuration with TypeScript, React, and Prettier integration
 * @author Extractify Development Team
 * @version 1.0.0
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
 * The configuration is structured in layers, with more specific rules
 * overriding general ones. Each configuration object targets specific
 * file patterns and provides appropriate linting rules.
 * 
 * @type {Array<Object>}
 */
export default [
  /**
   * Global Configuration
   * 
   * Applies to all files and sets up basic ignore patterns and
   * global linting options.
   */
  {
    ignores: ["dist", "dist-electron", ".vite", "node_modules"],
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },

  /**
   * Main/Preload Process Configuration
   * 
   * Targets Electron main process and preload scripts (*.ts files).
   * Enables Node.js globals and provides appropriate environment
   * for server-side TypeScript code.
   * 
   * @type {Object}
   */
  {
    files: ["electron/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  /**
   * Renderer Process Configuration
   * 
   * Targets React frontend files (*.ts, *.tsx) in the src directory.
   * Enables JSX parsing, browser globals, and React-specific plugins
   * for hooks and refresh functionality.
   * 
   * @type {Object}
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
   * 
   * Applies to all TypeScript files (*.ts, *.tsx) and provides
   * comprehensive linting rules for TypeScript, React, and Prettier
   * integration. This configuration should be applied last to ensure
   * proper rule precedence.
   * 
   * @type {Object}
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