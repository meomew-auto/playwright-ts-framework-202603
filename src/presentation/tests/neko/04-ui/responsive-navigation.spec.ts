/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🧭 NEKO COFFEE — RESPONSIVE NAVIGATION UI SPEC
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Kiểm thử tính năng Điều hướng Header Responsive trên 2 nền tảng:
 * 1. Desktop (1280x800): Hiển thị trực tiếp nút Desktop & Link Tra cứu đơn.
 * 2. Mobile (375x667): Hiển thị Hamburger Button, mở Drawer và Click Tra cứu đơn.
 *
 * 🎯 Chuẩn mực kiến trúc (AGENTS.md & playwright-test-crafting):
 * - 100% import { test, expect } từ @fixtures/neko (Super Fixture).
 * - Sử dụng guestPage (phiên sạch 0ms, Zero-Auth) và headerNavPage.
 * - Zero raw locator trong spec.
 * - Co-located Ternary pattern khắc phục lỗi Strict Mode Violation.
 */

import { test, expect } from "@fixtures/neko";

test.describe("🧭 Neko Coffee - Responsive Header Navigation @read @smoke", () => {
  test("TC_01: Chạy trên Desktop (setViewportSize 1280x800), kiểm tra nút Desktop hiển thị và click điều hướng tra cứu đơn thành công", async ({
    guestPage,
    headerNavPage,
  }) => {
    // 1. Cấu hình viewport kích thước Desktop (1280x800)
    await guestPage.setViewportSize({ width: 1280, height: 800 });

    // 2. Mở trang chủ Neko Coffee bằng phiên guestPage sạch bóng
    await headerNavPage.navigate("/");

    // 3. Kiểm tra các phần tử Header trên Desktop hiển thị
    await headerNavPage.expectOnPage();
    await headerNavPage.expectMenuButtonVisible();
    await headerNavPage.expectOrderTrackingVisible();

    // 4. Click điều hướng đến trang tra cứu đơn
    await headerNavPage.goToOrderTracking();

    // 5. Xác thực chuyển hướng URL tới trang tra cứu đơn thành công
    await headerNavPage.expectNavigatedToOrderTracking();
  });

  test("TC_02: Chạy trên Mobile (setViewportSize 375x667), kiểm tra nút Hamburger hiển thị, mở menu và click điều hướng tra cứu đơn thành công", async ({
    guestPage,
    headerNavPage,
  }) => {
    // 1. Cấu hình viewport kích thước Mobile (375x667)
    await guestPage.setViewportSize({ width: 375, height: 667 });

    // 2. Mở trang chủ Neko Coffee bằng phiên guestPage sạch bóng
    await headerNavPage.navigate("/");

    // 3. Kiểm tra nút Hamburger Menu hiển thị trên Mobile
    await headerNavPage.expectOnPage();
    await headerNavPage.expectMenuButtonVisible();

    // 4. Mở drawer menu trên mobile
    await headerNavPage.openMenuIfMobile();
    await headerNavPage.expectOrderTrackingVisible();

    // 5. Click điều hướng đến trang tra cứu đơn và xác thực chuyển hướng
    await headerNavPage.goToOrderTracking();
    await headerNavPage.expectNavigatedToOrderTracking();
  });
});
