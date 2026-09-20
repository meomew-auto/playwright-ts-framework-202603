# 🎯 Active Context (Ký Ức Đang Hoạt Động)

## 📌 Trạng Thái Hiện Tại:
- **Đã hoàn thành**:
  1. Cập nhật và liên kết `AGENTS.md` với Skill `playwright-test-crafting` (Mục 1 đến 8).
  2. Triệt tiêu các điểm hardcode: Breakpoint `mobileBreakpoint` trong `BasePage.ts`, Wildcard path aliases trong `tsconfig.json`, Test Data catalog trong `TestDataRepository.ts`.
  3. Xây dựng Page Object `NekoHeaderNavigationPage.ts` và test spec `responsive-navigation.spec.ts` chạy pass 100% trên cả Desktop lẫn Mobile.
  4. Mở rộng `responsive-navigation.spec.ts` với **TC_04** (Desktop click "Tra cứu đơn" + Landing Contract của trang đích) — POM được bổ sung locator/verification thay vì viết selector trong spec.
  5. Khởi tạo bộ nhớ **Memory Bank** cho học viên và AI Agent (Roo Code / Cline).

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
- Hướng dẫn học sinh cách dùng Roo Code tự động đọc `activeContext.md` khi mở bài học mới.
- (Tùy chọn) Bổ sung script CLI Scaffolding tự động `npm run scaffold:domain <name>`.
