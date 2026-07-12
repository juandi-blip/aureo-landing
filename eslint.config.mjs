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
    // Generated Lighthouse audit output — bundled/minified vendor JS, not ours.
    ".unlighthouse/**",
    // Vendored agent-skill scripts (mirrored in both dirs), not app source.
    ".claude/**",
    ".agents/**",
  ]),
]);

export default eslintConfig;
