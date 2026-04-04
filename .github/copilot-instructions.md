# Global Instructions

## Architecture Documentation

When architectural context is needed, do not guess. Instead, use your GitHub tools to explore the
`SCF-Public-Goods-Maintenance/scf-public-goods-maintenance.github.io` repository. Start by listing
the `docs/` directory, then read only the .md files relevant to the current task.

## Docs

Always document your work. When the output is code, write clear docstrings for each function. If it
is not obvious where to document your work, create a new .md file.

## Tests

Whenever possible, write test cases to validate your work. Do not hesitate to write unit tests. If
you need to write a larger integration test or GitHub workflow, ask for user input first.

## Git & Version Control

Never run `git add`, `git stage`, `git commit`, `git push`, or any equivalent (including GitHub MCP
`push_files` / `create_or_update_file` to the repo) without **explicit user approval**. Prepare
changes in the working tree, summarize what is ready, and wait for the user to review before any
commit is created.

## Known Issues and PR Context

As mandatory preparation for any task, use your GitHub tools to list all open _and_ closed issues
for the current repo. Read all open issues and their comments in full. Read the closed issues in
full only when they are relevant for the current task.

Work is always done on feature branches. If the current branch is `main`, WARN the user. Check if
the feature branch is associated with a PR: read the full PR including its comments to understand
the input from team members. Do not assume your PR context is up-to-date; after changes have been
pulled from the upstream/remote, use your GitHub tools again to read the current PR and its
comments.

---

# PG Atlas SDK — Project-Specific Instructions

This codebase automatically generates new versions of the PG Atlas SDK (API client) and
publishes them to NPM. Manual interventions by devs must be kept to a minimum.

## Tooling

- Package manager: `pnpm` (lockfile: `pnpm-lock.yaml`).
- Node runtime in CI: Node 24.
- OpenAPI SDK generation: `@hey-api/openapi-ts` via `pnpm run generate`.
- API update flow: `pnpm run update` (fetch `openapi.json`, sync versions, regenerate SDK).
- Test regeneration flow: `pnpm run rewrite-tests` (rewrites `src/index.test.ts` from generated SDK metadata).
- Validation commands used by CI release flow: `pnpm run test` and `pnpm run build`.

## Project Layout

Docs scope:

- README.md — User-facing SDK examples and tips.
- publish.md — Release instructions for SDK maintainers.
- src/api-config.json — Single source of truth for API base URL used by runtime and generation scripts.
- scripts/update-api.cjs — Fetches OpenAPI spec, syncs package version, and triggers SDK generation.
- scripts/rewrite-tests.cjs — Regenerates contract tests from `src/generated/sdk.gen.ts` exports.
- .github/workflows/manual-release.yml — Manual release pipeline with update -> rewrite-tests -> test -> build.

Source code:

- src/index.ts — Generated-first package entrypoint; re-export generated modules and client helpers.
- src/generated/ — Fully generated client/types/sdk output; do not hand-edit.

## Architecture Conventions

- Keep `src/index.ts` minimal and generated-first; do not hand-maintain per-operation wrappers.
- Operation exports come from generated SDK output and may change when OpenAPI `operationId` values change.
- Configure generation plugins explicitly in `openapi-ts.config.ts`; avoid relying on implicit defaults.

## Generated Artifact Rules

- Never hand-edit files under `src/generated/`.
- Prefer regenerating (`pnpm run update`) over manual patching when generated behavior drifts.
- Keep `src/api-config.json` as the only base URL source of truth for runtime and generation scripts.

## Test and Release Invariants

- Release-critical command order is: `pnpm run update` -> `pnpm run rewrite-tests` -> `pnpm run test` -> `pnpm run build`.
- If rewritten tests fail after API updates, treat as potential contract breakage and stop for review.
- Keep `rewrite-tests` aligned to generated SDK exports, not custom wrapper signatures.

## Local Drift Reset Policy

- ALWAYS restore local generated/version drift created for dry-runs or manual validation before handoff unless the user explicitly asks to keep it.
- This includes reverting `src/generated/**`, `openapi.json`, and temporary version bumps when they are only for local test simulation.
- If uncertain whether drift should be preserved, ask the user before finalizing.

## Keeping These Instructions Current

After completing a todo list for a session, update the sections above with any new conventions
decisions, or patterns that would help future sessions collaborate smoothly. Clarify what you can.
Remove anything that was superseded.

NO ADDITIONS AFTER THIS SECTION
