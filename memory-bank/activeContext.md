# 🎯 Active Context (Ký Ức Đang Hoạt Động)

## 📌 Trạng Thái Hiện Tại:
- **Đã hoàn thành**:
  1. Cập nhật và liên kết `AGENTS.md` với Skill `playwright-test-crafting` (Mục 1 đến 8).
  2. Triệt tiêu các điểm hardcode: Breakpoint `mobileBreakpoint` trong `BasePage.ts`, Wildcard path aliases trong `tsconfig.json`, Test Data catalog trong `TestDataRepository.ts`.
  3. Xây dựng Page Object `NekoHeaderNavigationPage.ts` và test spec `responsive-navigation.spec.ts` chạy pass 100% trên cả Desktop lẫn Mobile.
  4. **[2026-09-20] Refactor bằng chứng (Evidence-Based)**: POM + spec được viết lại theo DOM THẬT (probe live), loại bỏ selector legacy sai (`aside a, div[role='dialog'] a`, `header button.lg\:relative`); ma trận viewport Desktop **1280x800** / Mobile **375x667** qua `test.use({ viewport })` + TC_05 Dynamic Breakpoint. ✅ 6 passed.
  5. Khởi tạo bộ nhớ **Memory Bank** cho học viên và AI Agent (Roo Code / Cline).

## 🆕 Recent Changes (2026-09-20) — Refactor Header Navigation (Evidence-Based)
- **Bối cảnh**: `NekoHeaderNavigationPage` cũ dùng selector phỏng đoán (Drawer bám `aside a, div[role='dialog'] a, .space-y-1 a`; Desktop menu bám `header button.lg\:relative`) ⇒ mong manh, dễ vỡ khi DOM đổi.
- **Đã khảo sát lại LIVE (probe script + temp spec, sau đó XÓA sạch)** và viết lại cả POM lẫn spec theo đúng DOM thật:
  - Hamburger: `data-testid="header-button-mobile-menu"`.
  - Nav Link Desktop: `data-testid="header-nav-order-tracking"`, `href="/vi/order-tracking"`.
  - Drawer Mobile: **KHÔNG có** `role="dialog"`, **KHÔNG có** `aside`, container **KHÔNG có** testid → nhận diện bằng `page.locator("nav").filter({ has: getByTestId("mobile-nav-home") })` (mốc `mobile-nav-home` là DUY NHẤT trong Drawer).
  - Link "Tra cứu đơn" trong Drawer **KHÔNG có testid** → dùng `getByRole("link", { name: "Tra cứu đơn", exact: true })`; an toàn vì nav Desktop `display:none` bị loại khỏi Accessibility Tree ⇒ match = 1.
  - Breakpoint site = Tailwind `lg` (1024px) ⇒ trùng mặc định `mobileBreakpoint = 1024` của `BasePage`, KHÔNG cần override.
- **Zero `locator.or()` (bằng chứng cứng)**: Nav Desktop và Hamburger **cùng tồn tại trong DOM ở MỌI viewport** (`hidden lg:flex` / `lg:hidden`) ⇒ POM thêm `expectDesktopHeaderContract()` / `expectMobileHeaderContract()` assert `not.toBeVisible()` để KHÓA contract này và ngăn người học quay lại dùng `.or()`.
- **UI Contract Constants** export ngay từ POM (single source of truth, spec import lại — không hardcode): `NEKO_ORDER_TRACKING_PATH`, `NEKO_ORDER_TRACKING_LINK_LABEL`, `NEKO_ORDER_TRACKING_HEADING`, `NEKO_ORDER_CODE_LABEL`, `NEKO_PHONE_OR_EMAIL_LABEL`, `NEKO_TRACKING_SUBMIT_LABEL`, `NEKO_HEADER_MOBILE_MENU_TESTID`, `NEKO_HEADER_NAV_ORDER_TRACKING_TESTID`, `NEKO_HEADER_MOBILE_NAV_HOME_TESTID`, `NEKO_ORDER_TRACKING_URL_PATTERN`.
- **Spec `responsive-navigation.spec.ts` (5 TC)**: Desktop `test.use({ viewport: {1280,800} })` → TC_01 (Nav Link trực tiếp, Hamburger ẩn) + TC_02 (click thẳng → `/vi/order-tracking` + Landing Contract); Mobile `test.use({ viewport: {375,667} })` → TC_03 (Hamburger hiện, Nav Desktop ẩn, link trong Drawer chưa truy cập được) + TC_04 (mở Drawer → click → Landing Contract); TC_05 **Dynamic Breakpoint** (đang ở Desktop, `setViewportSize` xuống Mobile KHÔNG reload → POM tự chuyển nhánh ternary).
- 🧪 **Bằng chứng đã chạy**: `npx playwright test responsive-navigation.spec.ts --project=neko-ui --reporter=list` → **6 passed (setup + TC_01→TC_05), 9.5s**; `npx tsc --noEmit` → **0 error**. Log chứng minh ternary hoạt động runtime: cùng 1 test in ra cả `[🖥️ Desktop] 👆 Click <a> "Tra cứu đơn"` và (TC_05) `[📱 Mobile] 👆 Click <button> (no text)`.
- ℹ️ **Gotcha mới đã kiểm chứng**: `test.use({ viewport })` **có** tác dụng với `guestContext`/`guestPage` do fixture tạo thủ công (`browser.newContext()`), vì Playwright tiêm `_combinedContextOptions.viewport` trong `runBeforeCreateBrowserContext` (giống cơ chế đã gặp với `storageState`) ⇒ dùng cho ma trận viewport thay vì rải `setViewportSize()`.


## 🆕 Recent Changes (2026-09-20) — Spec Đăng nhập Neko Coffee
- **Spec mới**: `src/presentation/tests/neko/04-ui/login-form.spec.ts` (4 test case, import 100% từ `@fixtures/neko`):
  - `TC_01` UI contract (H1, 2 field required, nút submit, phiên khách KHÔNG có token).
  - `TC_02` Sai thông tin → Zod `ErrorSchemas.ApiError` cho HTTP 401 + dialog "Đăng nhập thất bại" + submit lại được.
  - `TC_03` Submit rỗng → HTML5 `required` chặn ở client, **KHÔNG** phát sinh request `/auth/login` (`trackLoginRequests`).
  - `TC_04` Admin login → Zod `authTokenResponseSchema` (HTTP 200) + Integrity Check (token localStorage **trùng chính xác** token backend) + teardown `clearStoredSession()` trong `finally`.
- **POM viết lại**: `NekoLoginPage.ts` bám `data-testid` thật (`login-form`, `login-input-username`, `login-input-password`, `login-button-submit`, `login-button-google`); trang có 3 `button[type=submit]` nên tuyệt đối không dùng `getByRole('button', { name: ... })`.
  - GOTCHA đã kiểm chứng LIVE: login **thành công thì SPA KHÔNG redirect** — vẫn ở `/vi/login`, chỉ đổi Header sang trạng thái đã xác thực ⇒ **không assert URL**.
- **🐞 Bug framework đã sửa**: `fixtures/neko/hybrid-auth.fixture.ts` → `guestContext` giờ ép `storageState: { cookies: [], origins: [] }`.
  - Nguyên nhân: Playwright ≥ 1.63 tự tiêm `_combinedContextOptions` (gồm `storageState`) vào **mọi** `browser.newContext()` thủ công (`node_modules/playwright/lib/index.js` → `runBeforeCreateBrowserContext`), khiến "phiên khách" vẫn dính token admin ⇒ mọi test guest/negative bị false negative.
- **Gia cố chống flake**: `test.describe.configure({ timeout: 60_000 })` ở cấp spec (không dùng `waitForTimeout`) + `navigate()` chờ thêm `waitForLoadState("load")` để React hydration xong trước khi click.
- ✅ `npm run typecheck` → **0 error**.
- ✅ `login-form.spec.ts --repeat-each=3` → **13 passed (12 TC + setup), 22.1s, 0 flake**.
- ✅ Regression `responsive-navigation.spec.ts` (spec dùng `guestPage`) → vẫn pass.
- ℹ️ **4 test đỏ CÓ SẴN (pre-existing), đã chứng minh bằng A/B test** (`git stash` fix fixture → kết quả giống hệt `4 failed / 20 passed`): `chat-realtime.spec.ts` (1 TC) và `products-list.spec.ts` (3 TC: phân trang + 2 TC tìm kiếm) — timeout do site LIVE + `fullyParallel` 4 worker + headed, **không** liên quan thay đổi lần này.

## 🆕 Recent Changes (2026-09-16)
- **Bổ sung TC_04 vào `responsive-navigation.spec.ts`** (Desktop click "Tra cứu đơn"):
  - Mở rộng POM `NekoHeaderNavigationPage` với **Landing Contract** của trang đích:
    `orderTrackingHeading` (H1), `orderCodeInput` (`getByLabel("Mã đơn hàng")`),
    `phoneOrEmailInput` (`getByLabel("Số điện thoại hoặc Email")`), `submitTrackingButton` ("Tra cứu ngay").
  - Thêm 2 semantic verification: `expectDesktopOrderTrackingLinkContract()` (nhãn + `href` trỏ `/order-tracking`,
    chứng minh là Nav Link TRỰC TIẾP trên Header Desktop, không qua Drawer) và
    `expectOnOrderTrackingPage()` (URL + H1 + form + nút submit).
  - **Zero raw locator trong spec**: TC_04 chỉ orchestrate 5 bước qua POM, không chạm selector.
  - ✅ `npm run typecheck` → 0 error.
  - ✅ `npx playwright test responsive-navigation.spec.ts --project=neko-ui` → **5 passed (setup + TC_01→TC_04)**, 15.4s.
  - ✅ `npx playwright test --project=neko-ui --list` → **47 tests / 6 files**.

## 🆕 Recent Changes (2026-09-14)
- Gỡ POM + spec thử nghiệm của một màn hình Admin chưa được deploy (ngoài phạm vi bài học) khỏi
  `ui/pages/neko-coffee/` và `presentation/tests/neko/04-ui/`, cùng khai báo fixture/barrel liên quan.
- `npm run typecheck` → 0 error.
- Đã commit + push lên `origin/main`: **`6829fe9`** (56 file, +3110/−1658) — working tree sạch,
  `main` khớp `origin/main`.

## 💡 Quyết Định Kỹ Thuật Đã Chốt:
- **Spec-First (RED-as-bug-evidence)**: khi tính năng chưa được deploy, KHÔNG dùng feature-guard `test.skip()`
  để che khuất bug trong báo cáo CI; test phải ĐỎ kèm message mô tả rõ bằng chứng. Chỉ dùng `test.skip()`
  cho trường hợp dữ liệu rỗng (empty state).
- Cấm dùng `locator.or()` trên giao diện Tailwind CSS responsive; bắt buộc dùng Inline Colocated Ternary với `this.isMobile()`.
- Các domain mới được hỗ trợ tự động qua path alias wildcard: `@fixtures/*`, `@pages/*`, `@services/*`, `@schemas/*`.

## ⏭️ Việc Cần Làm Tiếp Theo:
- Điều tra 4 test đỏ **pre-existing** (`chat-realtime` ×1, `products-list` ×3): nghi vấn vượt budget 30s khi chạy song song 4 worker + site LIVE ⇒ cân nhắc nâng timeout tương tự `login-form.spec.ts`.
- Hướng dẫn học sinh cách dùng Roo Code tự động đọc `activeContext.md` khi mở bài học mới.
- (Tùy chọn) Bổ sung script CLI Scaffolding tự động `npm run scaffold:domain <name>`.
