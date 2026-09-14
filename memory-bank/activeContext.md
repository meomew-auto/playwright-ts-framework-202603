# 🎯 Active Context (Ký Ức Đang Hoạt Động)

## 📌 Trạng Thái Hiện Tại:
- **Đã hoàn thành**:
  1. Cập nhật và liên kết `AGENTS.md` với Skill `playwright-test-crafting` (Mục 1 đến 8).
  2. Triệt tiêu các điểm hardcode: Breakpoint `mobileBreakpoint` trong `BasePage.ts`, Wildcard path aliases trong `tsconfig.json`, Test Data catalog trong `TestDataRepository.ts`.
  3. Xây dựng Page Object `NekoHeaderNavigationPage.ts` và test spec `responsive-navigation.spec.ts` chạy pass 100% trên cả Desktop lẫn Mobile.
  4. Khởi tạo bộ nhớ **Memory Bank** cho học viên và AI Agent (Roo Code / Cline).

## 🆕 Recent Changes (2026-09-14)
- Gỡ POM + spec thử nghiệm của một màn hình Admin chưa được deploy (ngoài phạm vi bài học) khỏi
  `ui/pages/neko-coffee/` và `presentation/tests/neko/04-ui/`, cùng khai báo fixture/barrel liên quan.
- `npm run typecheck` → 0 error.

## 💡 Quyết Định Kỹ Thuật Đã Chốt:
- **Spec-First (RED-as-bug-evidence)**: khi tính năng chưa được deploy, KHÔNG dùng feature-guard `test.skip()`
  để che khuất bug trong báo cáo CI; test phải ĐỎ kèm message mô tả rõ bằng chứng. Chỉ dùng `test.skip()`
  cho trường hợp dữ liệu rỗng (empty state).
- Cấm dùng `locator.or()` trên giao diện Tailwind CSS responsive; bắt buộc dùng Inline Colocated Ternary với `this.isMobile()`.
- Các domain mới được hỗ trợ tự động qua path alias wildcard: `@fixtures/*`, `@pages/*`, `@services/*`, `@schemas/*`.

## ⏭️ Việc Cần Làm Tiếp Theo:
- Hướng dẫn học sinh cách dùng Roo Code tự động đọc `activeContext.md` khi mở bài học mới.
- (Tùy chọn) Bổ sung script CLI Scaffolding tự động `npm run scaffold:domain <name>`.
