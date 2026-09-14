# 🧩 Fixtures — Playwright Test Infrastructure

## Tổng Quan

Folder `fixtures/` chứa toàn bộ fixture infrastructure cho Playwright tests.
Fixtures cung cấp **dependency injection** cho tests — mỗi test chỉ cần khai báo fixture cần dùng,
framework tự động khởi tạo dependencies theo đúng thứ tự.

## Kiến Trúc 3 Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                          TEST FILES                                  │
│   import { test, expect } from '@fixtures/cms'                      │
│   import { test, expect } from '@fixtures/neko'                     │
│   test('...', async ({ allProductsPage, productService }) => { ... })│
└──────────────────────────────┬───────────────────────────────────────┘
                               │ sử dụng
┌──────────────────────────────▼───────────────────────────────────────┐
│                     PROJECT LAYER (cms/, neko/)                       │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │ CMS (@fixtures/cms) — Super Fixture:                        │    │
│   │ cms-auth ──▶ cms-app ──▶ cms-super-gatekeeper ──▶ index.ts  │    │
│   │ (RAM Cookie) (POMs)      (Single Entrypoint)      (barrel)  │    │
│   └─────────────────────────────────────────────────────────────┘    │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │ NEKO (@fixtures/neko) — Super Fixture Bài 24:               │    │
│   │ hybrid-auth ──▶ hybrid-services ──▶ hybrid-app ──▶          │    │
│   │ (RAM snapshot)  (API clients/srv)   (POMs)                  │    │
│   │                     │                                       │    │
│   │                     ▼                                       │    │
│   │          hybrid-super-gatekeeper ──▶ index.ts (barrel)      │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ extends
┌──────────────────────────▼───────────────────────────────────────────┐
│                      AUTH LAYER (@auth)                              │
│           src/infrastructure/auth/ (Classes & Utils thuần túy)        │
│                                                                      │
│   ┌──────────────────┐  ┌────────────┐  ┌──────────────────────┐     │
│   │ BaseAuthProvider │  │ auth.types  │  │ storage-state.utils  │     │
│   │ (abstract class) │  │ (contracts) │  │ (file I/O)           │     │
│   └──────────────────┘  └────────────┘  └──────────────────────┘     │
│   ┌──────────────────┐  ┌────────────────────┐  ┌──────────────────┐ │
│   │ jwt.utils        │  │ CMSAuthProvider    │  │ NekoAuthProvider │ │
│   │ (decode/validate)│  │ (cookie-based)     │  │ (JWT + Zustand)  │ │
│   └──────────────────┘  └────────────────────┘  └──────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

## Connection Map

| File | Layer | Role | Depends On | Used By |
|------|-------|------|------------|---------|
| `auth/auth.types.ts` | auth | Shared auth interfaces | — | Tất cả AuthProviders |
| `auth/jwt.utils.ts` | auth | JWT decode/validate | auth.types | NekoAuthProvider |
| `auth/storage-state.utils.ts` | auth | File I/O cho storageState | auth.types | BaseAuthProvider |
| `auth/BaseAuthProvider.ts` | auth | Abstract auth class | storage-state.utils | CMS/Neko AuthProvider |
| `auth/cms/CMSAuthProvider.ts` | auth | Cookie-based auth | BaseAuthProvider | cms-auth, auth.setup |
| `auth/neko/NekoAuthProvider.ts` | auth | localStorage + Zustand auth | BaseAuthProvider | neko.setup.ts, role.fixture |
| `common/ViewportType.ts` | common | Shared viewport type | — | cms-auth, config |
| `cms/auth.setup.ts` | cms | Setup project | CMSAuthProvider, CMSLoginPage | playwright.config |
| `cms/cms-auth.fixture.ts` | cms | RAM Snapshot 0ms Cookie Auth | ViewportType, CMSLoginPage | cms-super-gatekeeper |
| `cms/cms-app.fixture.ts` | cms | POM fixtures (CMS) | cms-auth (authedPage) | cms-super-gatekeeper |
| `cms/cms-super-gatekeeper.fixture.ts` | cms | Merge Auth + App fixtures | cms-auth, cms-app | cms/index.ts |
| `cms/index.ts` | cms | Barrel export `@fixtures/cms` | cms-super-gatekeeper | CMS Test files |
| `neko/neko.setup.ts` | neko | Setup project | NekoAuthProvider | playwright.config |
| `neko/hybrid-auth.fixture.ts` | neko | RAM Snapshot 0ms auth (Staff & Admin) | — | hybrid-services, super-gatekeeper |
| `neko/hybrid-services.fixture.ts` | neko | API Services + Clients | hybrid-auth | super-gatekeeper |
| `neko/hybrid-app.fixture.ts` | neko | Neko POM fixtures | hybrid-auth | super-gatekeeper |
| `neko/role.fixture.ts` | neko | Multi-role browser context | @auth/neko | super-gatekeeper |
| `neko/hybrid-super-gatekeeper.fixture.ts`| neko | Merge UI + API + RAM + Roles | all neko fixtures | neko/index.ts |
| `neko/index.ts` | neko | Barrel export `@fixtures/neko` | super-gatekeeper | Neko Test files |

## Import Guide — Dùng File Nào?

| Scenario | Import From | Ví dụ fixture có sẵn |
|----------|-------------|---------------------|
| **CMS UI Tests** | `@fixtures/cms` | `authedPage`, `allProductsPage`, `dashboardPage`, `addNewProductPage`, `loginPage` |
| **Neko Tests** (UI, API, Hybrid) | `@fixtures/neko` | `productService`, `orderService`, `chatService`, `authedStaffClient`, `productsPage`, `ordersPage`, `asRole` |
| **Direct Playwright** | `@playwright/test` | Mocking thuần túy (`page.route`), không cần app fixtures |

## Auth Flow — CMS vs Neko

| | CMS | Neko |
|---|-----|------|
| **Auth mechanism** | Cookie-based (session) | JWT + localStorage (Zustand) |
| **Login method** | `loginViaUI()` (browser) | `login()` (API call) |
| **StorageState format** | `cookies: [{ name: 'ecommerce_cms_session' }]` | `origins: [{ localStorage: [{ name: 'neko_auth' }] }]` |
| **Validation** | Check cookie `expires` | Check `expiresAt` in neko_auth JSON |
| **Setup file** | `auth.setup.ts` | `neko.setup.ts` |
| **AuthProvider** | `CMSAuthProvider` (singleton: `cmsAuth`) | `NekoAuthProvider` (singleton: `nekoAuth`) |

## Thêm Project Mới

1. Tạo folder `fixtures/{project}/` với cấu trúc phẳng hóa (Super Fixture):
   ```
   {project}/
   ├── {Project}AuthProvider.ts   ← extends BaseAuthProvider
   ├── {project}.setup.ts         ← setup project
   ├── auth.fixture.ts            ← authed context / tokens
   ├── app.fixture.ts             ← POM fixtures
   ├── services.fixture.ts        ← API services (nếu có)
   ├── gatekeeper.fixture.ts      ← merge point
   └── index.ts                   ← barrel exports: export { test, expect }
   ```

2. Override 5 abstract methods trong `BaseAuthProvider`.
3. Thêm vào root `unified.fixture.ts` bằng `mergeTests()`.
4. Thêm project config vào `playwright.config.ts`.
