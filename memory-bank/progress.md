# 📊 Progress: Bảng Theo Dõi Tiến Độ

## ✅ Đã Hoàn Thành (Done)
- [x] **[2026-09-20] Spec Form Đăng nhập Neko Coffee (4 TC) + fix bug `guestContext`**:
  - [x] Viết lại POM `NekoLoginPage.ts` theo `data-testid` thật; thêm `expectGuestHeaderState()`, `loginAndCaptureResponse()`, `trackLoginRequests()`, `getStoredAccessToken()`, `clearStoredSession()`.
  - [x] Tạo spec `presentation/tests/neko/04-ui/login-form.spec.ts` (TC_01 UI contract, TC_02 401 + Zod ApiError + dialog, TC_03 HTML5 required không phát sinh request, TC_04 200 + Zod AuthTokenResponse + Integrity Check + teardown).
  - [x] 🐞 Fix framework: `hybrid-auth.fixture.ts` → `guestContext` ép `storageState: { cookies: [], origins: [] }` (Playwright ≥ 1.63 tự tiêm `_combinedContextOptions` vào `browser.newContext()` thủ công).
  - [x] Gia cố chống flake: `test.describe.configure({ timeout: 60_000 })` + `navigate()` chờ `waitForLoadState("load")` (hydration).
  - [x] `npm run typecheck` → 0 error; `login-form.spec.ts --repeat-each=3` → **13 passed / 22.1s, 0 flake**; `responsive-navigation.spec.ts` vẫn pass.
  - [x] A/B test bằng `git stash` chứng minh 4 test đỏ (`chat-realtime` 1 + `products-list` 3) là **pre-existing**, không do thay đổi lần này.
  - [x] Cập nhật MCP Memory (`.agents/memory.json`): entities `NekoLoginPage`, `NekoAuthLoginApi`, `NekoKnownPreExistingFailures` + gotcha `_combinedContextOptions` trong `PlaywrightTSFramework`.

- [x] **[2026-09-20] Refactor Evidence-Based `NekoHeaderNavigationPage` + spec ma trận viewport (Desktop 1280x800 / Mobile 375x667)**:
  - [x] Probe DOM LIVE (script tạm + temp spec) → chốt contract thật: Hamburger `header-button-mobile-menu`, Nav Desktop `header-nav-order-tracking`, Drawer = `nav` chứa mốc `mobile-nav-home`, link Drawer không có testid ⇒ `getByRole("link", { name: "Tra cứu đơn", exact: true })`.
  - [x] Viết lại POM: Locator Map + Inline Colocated Ternary (`this.isMobile()`), loại bỏ hoàn toàn selector legacy (`aside a, div[role='dialog'] a`, `header button.lg\:relative`) và Zero `locator.or()`.
  - [x] Export 10 hằng số UI CONTRACT từ POM (path/label/heading/testid/URL pattern) để spec import lại, không hardcode.
  - [x] Bổ sung semantic verifications: `expectDesktopHeaderContract()`, `expectMobileHeaderContract()`, `expectMobileDrawerOpened()`, `expectOnOrderTrackingPage()`, `openMobileDrawer()` (idempotent) + 3 alias tương thích ngược.
  - [x] Viết lại spec: 3 describe (Desktop / Mobile / Dynamic Breakpoint), `test.use({ viewport })` + `test.describe.configure({ timeout: 60_000 })`, 5 TC, Zero raw locator & Zero `waitForTimeout`.
  - [x] Dọn sạch artefact tạm: `scripts/_tmp-neko-header-probe.mjs`, `scripts/_probe-out.txt`, `src/presentation/tests/neko/04-ui/_tmp-probe.spec.ts`.
  - [x] `npx tsc --noEmit` → 0 error; `npx playwright test responsive-navigation.spec.ts --project=neko-ui --reporter=list` → **6 passed (setup + TC_01→TC_05), 9.5s**.
  - [x] Cập nhật MCP Memory: entity `NekoHeaderNavigationPage` (xóa observation legacy sai, thêm 6 observation 2026-09-20) + `PlaywrightTSFramework` (gotcha `test.use({ viewport })` tiêm được vào `guestContext`).


- [x] Kiến trúc Core BasePage & Locator Map Pattern.
- [x] TableColumnHelpers & CollectionHelper.
- [x] 6-Contract Super Fixture cho CMS và Neko Coffee.
- [x] Bộ 5 mô hình Hybrid E2E Dual-Engine.
- [x] Responsive Locators (Inline Colocated Ternary với this.isMobile()).
- [x] Domain Scaffolding Playbook (Mục 6 trong SKILL.md).
- [x] Flaky Test Diagnosis & Root Cause Taxonomy (Mục 7 trong SKILL.md).
- [x] Test Data Strategy (Catalog Pattern vs Dynamic Factory - Mục 8 trong SKILL.md).
- [x] Khởi tạo Memory Bank (Roo Code standard).
- [x] **[2026-09-14] Dọn phạm vi + phát hành**:
  - [x] Gỡ POM/spec ngoài phạm vi (chưa deploy) khỏi `ui/pages/neko-coffee/` + `presentation/tests/neko/04-ui/`.
  - [x] `npm run typecheck` → 0 error; `npx playwright test --project=neko-ui --list` → 45 tests / 6 files.
  - [x] Commit + push `origin/main` → `6829fe9` (56 file, +3110/−1658), working tree sạch.

- [x] **[2026-09-16] Test case Desktop Click Tra cứu đơn (TC_04)**:
  - [x] POM `NekoHeaderNavigationPage`: thêm 4 locators Landing Contract (`orderTrackingHeading`, `orderCodeInput`, `phoneOrEmailInput`, `submitTrackingButton`).
  - [x] POM: thêm `expectDesktopOrderTrackingLinkContract()` + `expectOnOrderTrackingPage()` (semantic verification, zero raw locator trong spec).
  - [x] Spec `responsive-navigation.spec.ts`: thêm TC_04 Desktop — verify nhãn + href Header link, click trực tiếp, verify trang đích render đầy đủ.
  - [x] `npm run typecheck` → 0 error; chạy thật **5 passed** (`--project=neko-ui responsive-navigation.spec.ts`); `--list` → 47 tests / 6 files.
  - [x] Cập nhật MCP Memory (`.agents/memory.json`): entities `NekoHeaderNavigationPage`, `NekoOrderTrackingPage` + gotcha 307 redirect `/` → `/vi`, SPA client-side nav.

## ⏳ Đang Thực Hiện (In Progress)
- [ ] Hướng dẫn học viên trải nghiệm Roo Code Memory Bank.

## 📋 Hàng Đợi Tương Lai (Backlog)
- [ ] CLI Domain Generator script (`scripts/scaffold-domain.ts`).
- [ ] DataFactory Toolkit cho dữ liệu Việt Nam.
