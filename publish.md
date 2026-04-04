# Publishing `@pg-atlas/sdk`

_SDK Maintainers: the API base URL is defined once in `src/api-config.json` and consumed by update/generation tooling._

Wait for the API deployment to complete before releasing. The latest `openapi.json` must be available.

## One-Time Setup

Activate pre-commit hooks:

```sh
pre-commit install
```

## Local Validation

Run from repository root:

```sh
pnpm install --frozen-lockfile
pnpm run update
pnpm run rewrite-tests
pnpm run test
pnpm run build
```

Step behavior:

- `pnpm run update` fetches `openapi.json`, syncs `package.json` version, and regenerates SDK output.
- `pnpm run rewrite-tests` regenerates `src/index.test.ts` from generated operations.
- `pnpm run test` validates generated operation exports and request behavior.
- `pnpm run build` compiles the package.

## Manual Release Workflow

1. Open the [Manual Release](https://github.com/SCF-Public-Goods-Maintenance/pg-atlas-sdk/actions/workflows/manual-release.yml) workflow page.
1. Trigger the workflow with `dry-run = true` first.
1. The workflow sequence is: update SDK, rewrite tests, test, build, then prepare release artifacts.
1. Review generated schema, SDK, and rewritten tests in the prepare release changes.
1. Trigger again with `dry-run = false` to publish.

## GitHub Release Notes

1. Draft a new GitHub release.
1. Use the package version as the title.
1. Use `Generate release notes` to produce a compare link.
1. Include a clear link to the corresponding API release.
1. Focus notes on API-consumer-impacting changes.

## Operational Notes

- API base URL source of truth is `src/api-config.json`.
- Generated SDK output in `src/generated/` is never hand-edited.
- Package entrypoint `src/index.ts` should remain generated-first and avoid hand-maintained operation wrappers.

## If Release Fails

- If `rewrite-tests` fails or rewritten tests fail, treat as potential API contract incompatibility.
- This SDK release flow is optimized for fast alignment with API updates; long-cycle compatibility policy belongs to API-side validation.
