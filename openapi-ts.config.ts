/// <reference types="node" />
import { defineConfig, UserConfig } from "@hey-api/openapi-ts";
import { readFileSync } from "fs";

type ApiConfig = {
  apiBaseUrl: string;
};

const apiConfig = JSON.parse(
  readFileSync(new URL("./src/api-config.json", import.meta.url), "utf8"),
) as ApiConfig;

const apiBaseUrl = apiConfig.apiBaseUrl.replace(/\/+$/, "");

export default defineConfig({
  input: `${apiBaseUrl}/openapi.json`,
  output: {
    path: "src/generated",
    source: true,
  },
  parser: {
    filters: {
      deprecated: false,
    },
  },
  plugins: [
    "@hey-api/typescript",
    {
      name: "@hey-api/sdk",
      operations: {
        strategy: "flat",
      },
      examples: true,
    },
    {
      name: "@hey-api/schemas",
      type: "json",
    },
  ],
} as UserConfig);
