#!/usr/bin/env node
const fs = require("fs");
const https = require("https");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SPEC_PATH = path.join(ROOT, "openapi.json");
const PKG_PATH = path.join(ROOT, "package.json");
const API_CONFIG_PATH = path.join(ROOT, "src", "api-config.json");

/**
 * Read and normalize the API base URL from the shared SDK config file.
 */
function readApiBaseUrl() {
  const apiConfig = JSON.parse(fs.readFileSync(API_CONFIG_PATH, "utf8"));
  if (!apiConfig.apiBaseUrl || typeof apiConfig.apiBaseUrl !== "string") {
    throw new Error("Invalid src/api-config.json: missing apiBaseUrl");
  }

  return apiConfig.apiBaseUrl.replace(/\/+$/, "");
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Bad status: ${res.statusCode}`));
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Invalid JSON received"));
          }
        });
      })
      .on("error", reject);
  });
}

async function main() {
  try {
    const specUrl = `${readApiBaseUrl()}/openapi.json`;

    console.log("⏳ Fetching PG Atlas OpenAPI spec…");
    const openapi = await fetchJson(specUrl);

    // Write pretty‑printed spec to file
    const pretty = JSON.stringify(openapi, null, 4) + "\n";
    fs.writeFileSync(SPEC_PATH, pretty, "utf8");
    console.log(`✔️  Wrote spec to ${SPEC_PATH}`);

    // Sync package.json version with spec
    if (!openapi.info || !openapi.info.version) {
      throw new Error("No info.version in fetched spec");
    }
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, "utf8"));
    pkg.version = openapi.info.version;

    fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log(`✔️  Synced package.json version → ${pkg.version}`);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}

main();
