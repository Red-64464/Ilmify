import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone Node.js test/utility scripts (CommonJS/ESM) — not part of the app build.
    "tests/**",
    // yt-dlp / youtube-dl runtime artifacts that may land at the project root.
    "*player-script*.js",
  ]),
]);

export default eslintConfig;
