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
    // three's Basis transcoder, copied verbatim by scripts/build-earth-textures.mjs.
    "public/basis/**",
    // Raw downloads and scratch (Playwright's transform cache lives in data_raw/_tmp): never source.
    "data_raw/**",
    // Browser and screen-reader tests: their own tsconfig (qa/tsconfig.json), outside the app.
    "qa/**",
  ]),
]);

export default eslintConfig;
