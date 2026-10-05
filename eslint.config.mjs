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
    // Background-agent git worktrees (each has its own node_modules/.next
    // build output) live nested under .claude/ — without a recursive
    // pattern here, ESLint happily walks into them and lints their
    // generated files too.
    "**/.claude/**",
    // 별도 앱 프로젝트들(Expo 앱 / TWA 래퍼)은 웹 린트 대상이 아니다.
    "mobile/**",
    "android-twa/**",
  ]),
]);

export default eslintConfig;
