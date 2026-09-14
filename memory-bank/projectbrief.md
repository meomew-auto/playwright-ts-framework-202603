# 📋 Project Brief: Enterprise Playwright TypeScript Multi-Domain Framework

## 🎯 Mục Tiêu Dự Án
Xây dựng và vận hành nền tảng kiểm thử tự động hóa cấp doanh nghiệp (Enterprise-Grade Test Automation Platform) sử dụng **Playwright + TypeScript**. Nền tảng được thiết kế theo kiến trúc hướng miền (Domain-Driven Architecture), sẵn sàng mở rộng không giới hạn cho nhiều domain nghiệp vụ độc lập (`cms`, `neko`, `crm`, `banking`, `logistics`...).

## 🌟 Phạm Vi & Đặc Điểm Cốt Lõi
1. **Multi-Domain Boundary**: Phân định ranh giới 3 tầng độc lập cho mọi domain:
   - `src/infrastructure/api/`: Clients ➔ Services ➔ Schemas (AOM 3 tầng).
   - `src/infrastructure/ui/pages/`: Page Object Models kế thừa `BasePage`.
   - `src/infrastructure/fixtures/`: 6-Contract Super Fixture (Worker-Scope RAM Snapshot, Zero disk I/O, guestPage).
2. **Modern Locator Map Pattern**: 100% locators gom trong `pageLocators` dictionary và sinh getter type-safe qua `createLocatorGetter`. Tích hợp `TableColumnHelpers` cho DataGrid.
3. **Responsive Locators**: Sử dụng Inline Colocated Ternary `this.isMobile() ? mobileSelector : desktopSelector`. Nghiêm cấm dùng `locator.or()` (tránh Strict Mode Violation trên Tailwind CSS) và cấm `if-else` trong action methods.
4. **5 Enterprise Hybrid E2E Models**: Kết hợp mượt mà giữa API Seeding, UI Actions, Reverse Network Audit (Zod), Dual-Role collaboration, và Sandwich Teardown.
5. **Zero Pollution & Data Isolation**: Mọi bài test ghi dữ liệu (`.write.spec.ts`) phải sở hữu dữ liệu riêng (timestamp duy nhất) và tự động dọn dẹp trong `finally`.
