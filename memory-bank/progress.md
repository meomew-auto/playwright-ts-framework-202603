# 📊 Progress: Bảng Theo Dõi Tiến Độ

## ✅ Đã Hoàn Thành (Done)
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
