#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SDK_GEN_PATH = path.join(ROOT, "src", "generated", "sdk.gen.ts");
const TEST_PATH = path.join(ROOT, "src", "index.test.ts");
const API_CONFIG_PATH = path.join(ROOT, "src", "api-config.json");

/**
 * Read a UTF-8 file from disk.
 */
function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

/**
 * Read and parse JSON from disk.
 */
function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

/**
 * Extract generated operation metadata from sdk.gen.ts.
 */
function extractGeneratedOperations(sourceText) {
  const operationMap = new Map();
  const regex =
    /export const (\w+)\s*=\s*<[\s\S]*?\)\.(get|post|put|patch|delete)<[\s\S]*?\{ url: '([^']+)'/g;

  let match;
  while ((match = regex.exec(sourceText)) !== null) {
    operationMap.set(match[1], {
      functionName: match[1],
      httpMethod: match[2].toUpperCase(),
      pathTemplate: match[3],
    });
  }

  return Array.from(operationMap.values()).sort((a, b) =>
    a.functionName.localeCompare(b.functionName),
  );
}

/**
 * Build deterministic path placeholder sample values.
 */
function samplePathTokenValue(token) {
  if (token === "submission_id" || token === "contributor_id") {
    return 101;
  }
  return "demo-id";
}

/**
 * Build one executable operation test case from generated metadata.
 */
function buildOperationCase(operation) {
  const pathValues = {};
  const expectedPath = operation.pathTemplate.replace(
    /\{([^}]+)\}/g,
    (_, token) => {
      const value = samplePathTokenValue(token);
      pathValues[token] = value;
      return encodeURIComponent(String(value));
    },
  );

  const requestOptions = {};
  if (Object.keys(pathValues).length > 0) {
    requestOptions.path = pathValues;
  }

  if (["POST", "PUT", "PATCH"].includes(operation.httpMethod)) {
    requestOptions.body = { ping: "pong" };
  }

  return {
    functionName: operation.functionName,
    httpMethod: operation.httpMethod,
    expectedPath,
    requestOptions,
  };
}

/**
 * Render the complete Vitest test file content.
 */
function renderTestFile(operationCases) {
  const serializedCases = JSON.stringify(operationCases, null, 2);

  return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as sdk from './index';
import { createClient } from './generated/client';
import apiConfig from './api-config.json';

describe('PG Atlas SDK generated contract tests', () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  const operationCases: Array<{
    functionName: string;
    httpMethod: string;
    expectedPath: string;
    requestOptions: Record<string, unknown>;
  }> = ${serializedCases};

  const mockResponse = (data: unknown, ok = true, status = 200) => ({
    ok,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => data,
    text: async () => JSON.stringify(data),
  });

  it('should expose generated SDK operations through package entrypoint', () => {
    for (const operation of operationCases) {
      expect(typeof (sdk as Record<string, unknown>)[operation.functionName]).toBe('function');
    }
  });

  for (const operation of operationCases) {
    it(\`routes \${operation.functionName} to \${operation.httpMethod} \${operation.expectedPath}\`, async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      const fn = (sdk as Record<string, any>)[operation.functionName];
      const client = createClient({ baseUrl: apiConfig.apiBaseUrl });
      const result = await fn({ client, ...operation.requestOptions });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [request, init] = mockFetch.mock.calls[0];
      const requestUrl = typeof request === 'string' ? request : request.url;
      const url = new URL(requestUrl);
      const requestMethod = (typeof request === 'string' ? init?.method : request.method) ?? 'GET';

      expect(url.origin).toBe(apiConfig.apiBaseUrl);
      expect(url.pathname).toBe(operation.expectedPath);
      expect(requestMethod).toBe(operation.httpMethod);
      expect(result).toHaveProperty('data');
    });
  }

  it('should pass Authorization header through configured client', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ status: 'ok' }));

    const operation = operationCases.find((candidate) => candidate.httpMethod === 'GET') ?? operationCases[0];
    const fn = (sdk as Record<string, any>)[operation.functionName];
    const client = createClient({
      baseUrl: apiConfig.apiBaseUrl,
      headers: { Authorization: 'Bearer test-token' },
    });

    await fn({ client, ...operation.requestOptions });

    const [request, init] = mockFetch.mock.calls[0];
    const headers = typeof request === 'string' ? init?.headers : request.headers;
    const auth = typeof headers.get === 'function' ? headers.get('Authorization') : headers.Authorization;
    expect(auth).toBe('Bearer test-token');
  });

  it('should expose error details for non-2xx responses', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ detail: 'Invalid token' }, false, 401));

    const operation = operationCases.find((candidate) => candidate.httpMethod === 'GET') ?? operationCases[0];
    const fn = (sdk as Record<string, any>)[operation.functionName];
    const client = createClient({ baseUrl: apiConfig.apiBaseUrl });
    const result = await fn({ client, ...operation.requestOptions });

    expect(result.error).toBeDefined();
  });
});
`;
}

/**
 * Generate and write src/index.test.ts based on sdk.gen.ts.
 */
function main() {
  const apiConfig = readJson(API_CONFIG_PATH);
  if (!apiConfig.apiBaseUrl || typeof apiConfig.apiBaseUrl !== "string") {
    throw new Error("Invalid src/api-config.json: missing apiBaseUrl");
  }

  const sdkSource = readText(SDK_GEN_PATH);
  const operations = extractGeneratedOperations(sdkSource);

  if (operations.length === 0) {
    throw new Error(
      "No generated SDK operations found in src/generated/sdk.gen.ts.",
    );
  }

  const operationCases = operations.map(buildOperationCase);
  const testContent = renderTestFile(operationCases);
  fs.writeFileSync(TEST_PATH, testContent, "utf8");

  console.log(
    `Rewrote ${path.relative(ROOT, TEST_PATH)} with ${
      operationCases.length
    } generated operation tests.`,
  );
}

try {
  main();
} catch (error) {
  console.error(`Failed to rewrite tests: ${error.message}`);
  process.exit(1);
}
