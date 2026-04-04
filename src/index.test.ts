import { describe, it, expect, vi, beforeEach } from "vitest";
import * as sdk from "./index";
import { createClient } from "./generated/client";
import apiConfig from "./api-config.json";

describe("PG Atlas SDK generated contract tests", () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  const operationCases: Array<{
    functionName: string;
    httpMethod: string;
    expectedPath: string;
    requestOptions: Record<string, unknown>;
  }> = [
    {
      functionName: "getContributorContributorsContributorIdGet",
      httpMethod: "GET",
      expectedPath: "/contributors/101",
      requestOptions: {
        path: {
          contributor_id: 101,
        },
      },
    },
    {
      functionName: "getMetadataMetadataGet",
      httpMethod: "GET",
      expectedPath: "/metadata",
      requestOptions: {},
    },
    {
      functionName: "getProjectDependsOnProjectsCanonicalIdDependsOnGet",
      httpMethod: "GET",
      expectedPath: "/projects/demo-id/depends-on",
      requestOptions: {
        path: {
          canonical_id: "demo-id",
        },
      },
    },
    {
      functionName:
        "getProjectHasDependentsProjectsCanonicalIdHasDependentsGet",
      httpMethod: "GET",
      expectedPath: "/projects/demo-id/has-dependents",
      requestOptions: {
        path: {
          canonical_id: "demo-id",
        },
      },
    },
    {
      functionName: "getProjectProjectsCanonicalIdGet",
      httpMethod: "GET",
      expectedPath: "/projects/demo-id",
      requestOptions: {
        path: {
          canonical_id: "demo-id",
        },
      },
    },
    {
      functionName: "getProjectReposProjectsCanonicalIdReposGet",
      httpMethod: "GET",
      expectedPath: "/projects/demo-id/repos",
      requestOptions: {
        path: {
          canonical_id: "demo-id",
        },
      },
    },
    {
      functionName: "getRepoDependsOnReposCanonicalIdDependsOnGet",
      httpMethod: "GET",
      expectedPath: "/repos/demo-id/depends-on",
      requestOptions: {
        path: {
          canonical_id: "demo-id",
        },
      },
    },
    {
      functionName: "getRepoHasDependentsReposCanonicalIdHasDependentsGet",
      httpMethod: "GET",
      expectedPath: "/repos/demo-id/has-dependents",
      requestOptions: {
        path: {
          canonical_id: "demo-id",
        },
      },
    },
    {
      functionName: "getRepoReposCanonicalIdGet",
      httpMethod: "GET",
      expectedPath: "/repos/demo-id",
      requestOptions: {
        path: {
          canonical_id: "demo-id",
        },
      },
    },
    {
      functionName: "getSbomSubmissionIngestSbomSubmissionIdGet",
      httpMethod: "GET",
      expectedPath: "/ingest/sbom/101",
      requestOptions: {
        path: {
          submission_id: 101,
        },
      },
    },
    {
      functionName: "healthHealthGet",
      httpMethod: "GET",
      expectedPath: "/health",
      requestOptions: {},
    },
    {
      functionName: "ingestSbomIngestSbomPost",
      httpMethod: "POST",
      expectedPath: "/ingest/sbom",
      requestOptions: {
        body: {
          ping: "pong",
        },
      },
    },
    {
      functionName: "listProjectsProjectsGet",
      httpMethod: "GET",
      expectedPath: "/projects",
      requestOptions: {},
    },
    {
      functionName: "listReposReposGet",
      httpMethod: "GET",
      expectedPath: "/repos",
      requestOptions: {},
    },
    {
      functionName: "listSbomSubmissionsIngestSbomGet",
      httpMethod: "GET",
      expectedPath: "/ingest/sbom",
      requestOptions: {},
    },
  ];

  const mockResponse = (data: unknown, ok = true, status = 200) => ({
    ok,
    status,
    headers: new Headers({ "Content-Type": "application/json" }),
    json: async () => data,
    text: async () => JSON.stringify(data),
  });

  it("should expose generated SDK operations through package entrypoint", () => {
    for (const operation of operationCases) {
      expect(
        typeof (sdk as Record<string, unknown>)[operation.functionName],
      ).toBe("function");
    }
  });

  for (const operation of operationCases) {
    it(`routes ${operation.functionName} to ${operation.httpMethod} ${operation.expectedPath}`, async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      const fn = (sdk as Record<string, any>)[operation.functionName];
      const client = createClient({ baseUrl: apiConfig.apiBaseUrl });
      const result = await fn({ client, ...operation.requestOptions });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [request, init] = mockFetch.mock.calls[0];
      const requestUrl = typeof request === "string" ? request : request.url;
      const url = new URL(requestUrl);
      const requestMethod =
        (typeof request === "string" ? init?.method : request.method) ?? "GET";

      expect(url.origin).toBe(apiConfig.apiBaseUrl);
      expect(url.pathname).toBe(operation.expectedPath);
      expect(requestMethod).toBe(operation.httpMethod);
      expect(result).toHaveProperty("data");
    });
  }

  it("should pass Authorization header through configured client", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ status: "ok" }));

    const operation =
      operationCases.find((candidate) => candidate.httpMethod === "GET") ??
      operationCases[0];
    const fn = (sdk as Record<string, any>)[operation.functionName];
    const client = createClient({
      baseUrl: apiConfig.apiBaseUrl,
      headers: { Authorization: "Bearer test-token" },
    });

    await fn({ client, ...operation.requestOptions });

    const [request, init] = mockFetch.mock.calls[0];
    const headers =
      typeof request === "string" ? init?.headers : request.headers;
    const auth =
      typeof headers.get === "function"
        ? headers.get("Authorization")
        : headers.Authorization;
    expect(auth).toBe("Bearer test-token");
  });

  it("should expose error details for non-2xx responses", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ detail: "Invalid token" }, false, 401),
    );

    const operation =
      operationCases.find((candidate) => candidate.httpMethod === "GET") ??
      operationCases[0];
    const fn = (sdk as Record<string, any>)[operation.functionName];
    const client = createClient({ baseUrl: apiConfig.apiBaseUrl });
    const result = await fn({ client, ...operation.requestOptions });

    expect(result.error).toBeDefined();
  });
});
