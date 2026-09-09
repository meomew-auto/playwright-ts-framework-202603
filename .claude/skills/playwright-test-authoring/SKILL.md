---
name: playwright-test-authoring
description: Author and review Playwright TypeScript tests in this repository using the existing POM, API Object Model, fixture, contract, and hybrid API-UI architecture.
---

# Playwright Test Authoring

Use this skill for any new or modified test in this repository.

## Fixture-first rule

Every business test must import `test` and `expect` from the selected domain fixture barrel or the unified fixture entrypoint. This is mandatory for UI, API, and hybrid tests. The fixture is the composition root for authentication, Page Objects, API clients/services, data helpers, role isolation, and teardown.

Do not import `test` from `@playwright/test` in a business spec. Do not create a raw `browser.newContext()`, `request.newContext()`, or ad-hoc Page Object inside a spec. If a required capability is missing, extend the domain fixture and its types first, then consume it from the test.

Direct `@playwright/test` imports are allowed only inside fixture implementations, setup projects, or explicitly isolated infrastructure tests. Such files are not business-test templates.

## Dynamic role-session contract

Do not hard-code one domain's fixture names as a universal rule. First inspect the selected domain's fixture barrel, fixture types, and README, then build a role map:

```ts
type RoleSession = {
  role: string;
  ui: string;       // isolated Page/Context fixture
  token: string;    // worker RAM snapshot token
  api: string;      // authenticated client/service fixture
};
```

Every domain fixture should declare which role is injected into the standard `page` (`defaultRole`) and expose named sessions for other roles. The Neko mapping is only an example:

| Role | UI fixture | API fixture |
| --- | --- | --- |
| Staff/default | `page` | `staffToken`, `authedStaffClient` |
| Admin | `adminPage` | `adminToken`, `authedAdminClient` |

For another domain, use its own names (`viewerPage`, `operatorPage`, `auditorClient`, etc.) and preserve the same invariants: worker-scoped RAM snapshot, role-specific API client, isolated Browser Context, `addInitScript` auth injection, and teardown. Never infer a role from a generic fixture name or copy tokens between contexts.

### New-domain onboarding

When the selected domain does not have a role manifest:

1. Inspect its auth provider, fixture barrel, Page Object directory, API clients/services, and environment config.
2. Define a typed role map with `defaultRole`, `workerSnapshots`, `uiSessions`, `apiSessions`, and `entrypoint`.
3. Implement worker-scoped authentication once per role; expose role-specific UI and API fixtures; close every created request context and Browser Context in teardown.
4. Add a domain README showing the fixture names and a minimal UI, API, and hybrid example.
5. Only then add specs that import the domain entrypoint.

The implementation names are domain-specific; the invariants are not. A new domain is complete when an agent can answer, from its fixture types and README, “which role does the default page use?”, “which fixture gives me the operator API client?”, and “which isolated page should I use for the auditor flow?”

## Before editing

1. Read the target Page Object, API client/service, schema, fixture barrel, and one nearby spec.
2. Identify the intended project (`cms-*`, `neko-api`, `neko-ui`, or `neko-hybrid`) and the required fixture entrypoint.
3. Check whether the behavior is read-only, mutating, mobile-specific, network-mocked, or hybrid.

## Required patterns

### UI/POM

```ts
import { test, expect } from '<domain-fixture-entrypoint>';

test('shows the product', async ({ productsPage }) => {
  await productsPage.goto();
  await productsPage.expectOnPage();
  await productsPage.expectProductVisible('Arabica');
});
```

Keep selectors in the Page Object. Prefer role, label, test id, and text contracts. Add a business-level Page Object method when a flow is reused.

### Locator discovery and POM implementation

Follow this order before adding a selector:

1. Inspect the rendered element and its accessible role/name, label, test id, or stable data attribute.
2. Search existing Page Objects and components for the same control and reuse their locator contract.
3. Add the locator to the Page Object's locator map, following the style of `CMSAddNewProductPage`; keep selectors private to the POM.
4. Implement a business-level method that composes the locator and action, then add `expectOnPage()` and focused verification methods.
5. Run the target test with trace or headed mode when the locator is uncertain; do not guess from CSS layout classes.

Locator priority: `getByRole` with an accessible name, `getByLabel`, `getByTestId`, stable `data-*` contract, then a narrowly scoped CSS locator. XPath, generated class names, positional selectors, and `nth()` are last-resort choices and require a comment explaining the invariant.

For a form POM such as `CMSAddNewProductPage`, keep field locators, select/upload helpers, submit actions, and field verification inside the page class. The spec should provide typed data and call methods such as `fillForm`, `submit`, and `expectValidationError`; it should not reach into the form's DOM.

### API/AOM

```ts
import { test, expect } from '<domain-fixture-entrypoint>';

test('creates a product @write @crud', async ({ productService }) => {
  const payload = createUniqueProductPayload();
  const created = await productService.createProduct(payload);
  expect(created.name).toBe(payload.name);
});
```

Use the fixture client/service and existing Zod schema. Assert status, important response fields, and negative contracts where relevant. Do not instantiate raw request contexts in the spec.

### API implementation workflow

Before adding an API test, trace the endpoint through the existing client, service, request/response model, and Zod schema. Add transport behavior to the client, business operations to the service, and contract parsing at the response boundary. The spec should call the typed service/client fixture and assert business outcomes; it should not build URLs, headers, or raw request contexts itself.

### Hybrid

Use API for setup, POM for the user-visible action, and API for persistence verification/cleanup. Capture responses before the action with `Promise.all`. Always clean created records in `finally` when the API supports deletion.

For cross-role workflows, keep the role boundary visible in the test: pair each domain's role-specific API fixture with its role-specific UI fixture. Use a domain `asRole()` helper only when the scenario needs an additional isolated role context.

## Prohibited in new code

- `waitForTimeout` for synchronization.
- `test.only` or skipped assertions.
- Hard-coded URLs, credentials, tokens, or environment-specific IDs.
- Direct `page.locator`, `page.goto`, or form interaction in ordinary business specs when a Page Object exists.
- `any` when a fixture, Page Object, model, or Playwright type can express the contract.
- Fabricated auth-token fallback or a warning-only login failure.
- Mutating shared JSON catalog objects.

## Verification

Run `npm run typecheck`, then the narrowest project command. For shared fixture/config/auth changes, also run `npm test -- --list` and the affected API/UI/hybrid project. Report any live-environment limitation separately from code failures.
