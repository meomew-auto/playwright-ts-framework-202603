# Playwright TypeScript Framework Rules

## Scope

This repository is a Playwright + TypeScript test framework with separate CMS and Neko domains. Keep production test code under `src/infrastructure` and `src/presentation/tests`; use the existing aliases from `tsconfig.json`.

## Quality baseline

- Run `npm run typecheck` after TypeScript changes.
- Run the smallest relevant Playwright project, then expand to the suite when shared fixtures, config, auth, or API contracts change.
- Do not add dependencies without first checking `package.json`, `package-lock.json`, the active Node environment, and the local package cache. Prefer the existing packages.
- Never commit credentials, tokens, generated auth state, reports, traces, or test results. `.env.development`, `.env.*.local`, `.auth/`, `allure-results/`, and reports are local artifacts.
- Do not use `test.only`, arbitrary sleeps, or hard-coded environment URLs in new tests.
- Treat a test as invalid if it can pass with a fabricated auth token or by skipping the real assertion. Auth failures must fail the test; do not introduce or copy mock-token fallbacks into production fixtures.

## Test architecture

### Fixture selection

- Domain UI: import `test, expect` from that domain's fixture barrel.
- Domain API, UI, or hybrid: use the same domain entrypoint unless the project explicitly provides a narrower fixture.
- Cross-domain only: use the unified fixture entrypoint.
- **Business specs must use a domain fixture entrypoint 100% of the time.** Do not import `test` from `@playwright/test`, create raw browser/request contexts, or bypass fixture-provided Page Objects/API clients in a business spec.
- `@playwright/test` direct imports are reserved for implementing fixtures, setup projects, or explicitly isolated infrastructure tests; mark those files and do not use them as templates for ordinary tests.

Each domain's super fixture should be the preferred entrypoint for that domain. It composes auth, API clients/services, Page Objects, and role-isolated contexts. Fixtures are lazy; request only the fixtures used by the test.

### Dynamic multi-role RAM snapshot contract

For every domain, define a domain fixture manifest with:

| Contract | Meaning |
| --- | --- |
| `defaultRole` | Role injected into the standard `page` fixture |
| `workerSnapshots` | One worker-scoped auth snapshot per role, kept in RAM |
| `uiSessions` | Named Page/Context fixtures mapped to roles |
| `apiSessions` | Named authenticated API clients/services mapped to the same roles |
| `entrypoint` | Domain barrel import used by specs |

One domain may use `defaultRole=staff` and another may use `defaultRole=operator`; names such as `viewerPage`, `operatorPage`, `managerClient`, or `auditorClient` are valid. The role mapping must be explicit in that domain's fixture README and types.

Each role UI session must own an isolated Browser Context and inject only that role's auth state. Never infer permissions from a generic `page`, copy tokens between contexts, or reuse one role's API client for another role. If authentication cannot obtain a real token, fail the fixture instead of silently using a fabricated token for release-gating tests.

### Page Object Model

- Put selectors and UI actions in `src/infrastructure/ui/pages` or `components`, never in ordinary specs.
- Prefer accessible locators (`getByRole`, `getByLabel`, `getByTestId`) and page-owned locator maps. Avoid CSS/XPath tied to layout unless there is no stable semantic contract.
- Page methods should express business actions (`createProduct`, `filterByStatus`, `expectProductVisible`), not expose raw implementation details.
- Every new Page Object should extend the appropriate base page and implement `expectOnPage()`.
- Specs orchestrate; Page Objects act; assertions about the UI may be exposed by Page Object verification methods when reused.

### API Object Model

- Use existing clients under `src/infrastructure/api/clients` for endpoint transport and services under `.../api/services` for business workflows.
- Reuse typed models and Zod schemas. Validate successful and negative responses at the contract boundary.
- Do not create `request.newContext()` in a spec when an API client/service fixture already exists.
- Keep request context disposal inside fixtures/services.

### Hybrid tests

Use the sandwich flow for cross-layer behavior:

1. Seed minimal deterministic data through an API client/service.
2. Perform only the UI action under test through a Page Object.
3. Verify the visible UI result and, when persistence matters, audit through the API.
4. Clean up created data in `finally` or a fixture teardown.

Use `Promise.all([page.waitForResponse(...), action])` for network synchronization. Prefer state-based waits and Playwright auto-waiting over `waitForTimeout`.

### Data, naming, and isolation

- Put reusable payloads and factories under `src/infrastructure/data`; do not mutate imported JSON fixtures.
- `.read.` tests must be independent and parallel-safe. `.write.` tests must create unique data and clean it up; use serial mode only when the product workflow truly requires ordering.
- Use the existing filename convention: `{feature}.{action}.spec.ts`, `{feature}.mobile.spec.ts`.
- Add meaningful tags such as `@smoke`, `@read`, `@write`, `@crud` to the describe title.

## Known cleanup backlog

The framework currently typechecks and lists tests successfully, but it is not fully clean yet. Existing legacy/demo specs contain direct locators, hard-coded URLs, sleeps, and broad `any` types. Refactor these incrementally; do not copy those patterns into new tests. The hybrid auth fixture also contains fabricated-token fallbacks that should be removed or made fail-fast before relying on it for release-gating tests.
