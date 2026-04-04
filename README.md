# PG Atlas SDK

The PG Atlas SDK provides a simple interface for interacting with the [PG Atlas](https://github.com/SCF-Public-Goods-Maintenance/pg-atlas-backend) backend API.

## Features

- Liveness check (`getHealth`)
- Submit SPDX 2.3 SBOM artifacts (`ingestSbom`)
- List and filter SBOM submissions (`listSbomSubmissions`)
- Retrieve submission details (`getSbomSubmission`)

## Installation

```sh
npm install @pg-atlas/sdk
```

## Example Usage

### Liveness check

```ts
import { getHealth } from "@pg-atlas/sdk";

const health = await getHealth();
console.log(health.status); // "ok"
```

### Submit an SBOM (requires GitHub OIDC token)

```ts
import { client, ingestSbom } from "@pg-atlas/sdk";

// Configure with OIDC token
client.setConfig({
  apiKey: "your-github-oidc-token",
});

const result = await ingestSbom(mySbom);
console.log(`Accepted ${result.package_count} packages for ${result.repository}`);
```

### List submissions

```ts
import { listSbomSubmissions } from "@pg-atlas/sdk";

const submissions = await listSbomSubmissions({
  repository: "SCF-Public-Goods-Maintenance/pg-atlas-sdk",
  limit: 10,
});

submissions.items.forEach((item) => {
  console.log(`[${item.status}] Submited at ${item.submitted_at}`);
});
```

### Advanced: Instance based client

```ts
import { PGAtlasClient } from "@pg-atlas/sdk";

const sdk = new PGAtlasClient({
  baseUrl: "https://api.pg-atlas.example.com",
  apiKey: "optional-token",
});

const health = await sdk.getHealth();
```

## Configuration

The SDK can be configured using `client.setConfig` for global usage or by passing options to the `PGAtlasClient` constructor.

| Attribute | Default | Description |
| --------- | ------- | ----------- |
| `baseUrl` | `https://pg-atlas-backend-h8gen.ondigitalocean.app` | The root URL of the PG Atlas API. |
| `apiKey`  | `""` | The Bearer token for authenticated requests (e.g. GitHub OIDC JWT). |

## License

Copyright 2026 PG Atlas Contributors

[MIT License](https://opensource.org/license/mit)
