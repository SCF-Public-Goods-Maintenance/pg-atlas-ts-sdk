// Re-export generated SDK artifacts directly so new API operations are
// available automatically after regeneration.
export * from "./generated/types.gen";
export * from "./generated/sdk.gen";
export * from "./generated/schemas.gen";
export { client } from "./generated/client.gen";
export { createClient, createConfig, mergeHeaders } from "./generated/client";
export type {
  Client,
  ClientOptions,
  Config,
  CreateClientConfig,
  Options,
  RequestOptions,
  RequestResult,
  ResponseStyle,
  TDataShape,
} from "./generated/client";
