import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, // Test-specific rules
{
  plugins: {
    "simple-import-sort": simpleImportSort,
  },
  rules: {
    "simple-import-sort/imports": [
        "error",
      {
        "groups": [["^\\u0000", "^@?\\w", "^[^.]", "^\\."]]
      }
    ],
    "simple-import-sort/exports": "error",
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }]
  },
  languageOptions: {
    sourceType: "module",
    ecmaVersion: "latest",
  },
}, {
  files: ["**/*.test.ts", "**/*.test.tsx", "src/test/**/*.ts", "src/test/**/*.tsx", "e2e/**/*.spec.ts"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off", // Allow any in test files
    "simple-import-sort/imports": "error",
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }]
  }
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "dist/**", "next-env.d.ts"]
}];

export default eslintConfig;
