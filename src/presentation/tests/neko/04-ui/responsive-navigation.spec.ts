/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🧭 NEKO COFFEE — ĐIỀU HƯỚNG THANH HEADER RESPONSIVE (UI TESTS)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tính năng: Điều hướng Header tới trang Tra cứu đơn hàng `/vi/order-tracking`
 * URL: https://coffee.autoneko.com
 * Loại: Chỉ đọc (read-only) — dùng `guestPage` (phiên khách sạch, Zero Auth)
 *
 * 📌 MA TRẬN VIEWPORT (yêu cầu bài kiểm thử):
 * 1. Desktop 1280x800 — link "Tra cứu đơn" là Nav Link TRỰC TIẾP trên Header
 *    (`data-testid="header-nav-order-tracking"`), KHÔNG cần mở Drawer.
 * 2. Mobile 375x667 — nút Hamburger (`data-testid="header-button-mobile-menu"`)
 *    mở Drawer, rồi click link "Tra cứu đơn" bên trong Drawer.
 *
 * 🎯 CHUẨN MỰC KIẾN TRÚC (AGENTS.md & skill playwright-test-crafting):
 * - 100% import `{ test, expect }` từ `@fixtures/neko` (Super Fixture).
 * - ZERO raw locator trong spec: mọi selector nằm trong POM `NekoHeaderNavigationPage`.
 * - ZERO `locator.or()`: cả Nav Desktop lẫn Hamburger cùng tồn tại trong DOM ở mọi
 *   viewport (Tailwind ẩn/hiện bằng `hidden lg:flex` / `lg:hidden`) ⇒ bắt buộc dùng
 *   Inline Colocated Ternary với `this.isMobile()` trong `pageLocators` của POM.
 * - ZERO `waitForTimeout`: chỉ dùng auto-waiting assertion.
 * - `test.use({ viewport })` được ưu tiên thay cho `setViewportSize()` rải rác
 *   (Playwright tự tiêm viewport vào CẢ `guestContext` do fixture tạo thủ công).
 *
 * 🧪 SMOKE COMMAND:
 * npx playwright test responsive-navigation.spec.ts --project=neko-ui --reporter=list
 */

import { test, expect } from "@fixtures/neko";
import { NEKO_ORDER_TRACKING_PATH } from "@pages/neko/NekoHeaderNavigationPage";

// ─────────────────────────────────────────────────────────────────────────────
// Viewport chuẩn của bài kiểm thử (Desktop & Mobile)
// ─────────────────────────────────────────────────────────────────────────────
const DESKTOP_VIEWPORT = { width: 1280, height: 800 } as const;
const MOBILE_VIEWPORT = { width: 375, height: 667 } as const;

// ═════════════════════════════════════════════════════════════════════════════
// 🖥️ DESKTOP 1280x800 — Link "Tra cứu đơn" là Nav Link trực tiếp
// ═════════════════════════════════════════════════════════════════════════════
test.describe("🖥️ Neko Header Navigation - Desktop (1280x800) @read @smoke", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  // ⏱️ Nới budget 60s: suite đánh thẳng vào site LIVE và chạy song song 4 worker
  // (fullyParallel) ⇒ cần dư địa hơn mặc định 30s. KHÔNG dùng waitForTimeout.
  test.describe.configure({ timeout: 60_000 });

  test("TC_01: Desktop — Nav Link 'Tra cứu đơn' hiển thị TRỰC TIẾP trên Header, nút Hamburger bị ẩn", async ({
    guestPage,
    headerNavPage,
  }) => {
    // 1. Mở trang chủ bằng phiên khách sạch với viewport Desktop 1280x800
    await headerNavPage.navigate("/");
    expect(guestPage.viewportSize()).toEqual({ ...DESKTOP_VIEWPORT });

    // 2. Header render đúng chế độ Desktop (Nav Link trực tiếp, KHÔNG Drawer)
    await headerNavPage.expectOnPage();

    // 3. UI Contract: đúng nhãn "Tra cứu đơn" + href trỏ /vi/order-tracking
    //    + Hamburger VẪN trong DOM nhưng KHÔNG hiển thị (minh chứng cấm locator.or())
    await headerNavPage.expectDesktopHeaderContract();
  });

  test("TC_02: Desktop — Click trực tiếp Nav Link 'Tra cứu đơn' điều hướng tới /vi/order-tracking và trang đích render đầy đủ", async ({
    guestPage,
    headerNavPage,
  }) => {
    // 1. Mở trang chủ với viewport Desktop 1280x800
    await headerNavPage.navigate("/");
    await headerNavPage.expectDesktopHeaderContract();

    // 2. Click TRỰC TIẾP Nav Link trên Header (không mở Drawer/Menu trung gian)
    await headerNavPage.goToOrderTracking();

    // 3. Điều hướng đúng đường dẫn yêu cầu (assert cả URL tuyệt đối lẫn pathname)
    await headerNavPage.expectNavigatedToOrderTracking();
    expect(new URL(guestPage.url()).pathname).toBe(NEKO_ORDER_TRACKING_PATH);

    // 4. Landing Contract: H1 + 2 trường nhập liệu + nút "Tra cứu ngay" đã render
    await headerNavPage.expectOnOrderTrackingPage();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 📱 MOBILE 375x667 — Hamburger mở Drawer ➔ Link "Tra cứu đơn"
// ═════════════════════════════════════════════════════════════════════════════
test.describe("📱 Neko Header Navigation - Mobile (375x667) @read @smoke", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.describe.configure({ timeout: 60_000 });

  test("TC_03: Mobile — Nút Hamburger hiển thị, Nav Link Desktop bị ẩn và link 'Tra cứu đơn' chưa thể truy cập", async ({
    guestPage,
    headerNavPage,
  }) => {
    // 1. Mở trang chủ bằng phiên khách sạch với viewport Mobile 375x667
    await headerNavPage.navigate("/");
    expect(guestPage.viewportSize()).toEqual({ ...MOBILE_VIEWPORT });

    // 2. Header render đúng chế độ Mobile (Hamburger hiển thị)
    await headerNavPage.expectOnPage();

    // 3. Nav Link Desktop bị CSS ẩn nhưng VẪN trong DOM; Drawer đang đóng
    //    ⇒ link "Tra cứu đơn" chỉ có thể tiếp cận SAU KHI mở Drawer
    await headerNavPage.expectMobileHeaderContract();
  });

  test("TC_04: Mobile — Mở Drawer bằng Hamburger, click 'Tra cứu đơn' điều hướng tới /vi/order-tracking", async ({
    guestPage,
    headerNavPage,
  }) => {
    // 1. Mở trang chủ với viewport Mobile 375x667
    await headerNavPage.navigate("/");
    await headerNavPage.expectMobileHeaderContract();

    // 2. Mở Drawer qua nút Hamburger `header-button-mobile-menu`
    await headerNavPage.openMobileDrawer();

    // 3. Drawer Contract: container hiển thị + link "Tra cứu đơn" đúng nhãn & href
    await headerNavPage.expectMobileDrawerOpened();

    // 4. Click link trong Drawer → điều hướng tới /vi/order-tracking
    await headerNavPage.goToOrderTracking();
    await headerNavPage.expectNavigatedToOrderTracking();
    expect(new URL(guestPage.url()).pathname).toBe(NEKO_ORDER_TRACKING_PATH);

    // 5. Landing Contract của trang đích đã render đầy đủ (SPA hydrate xong)
    await headerNavPage.expectOnOrderTrackingPage();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 🔄 DYNAMIC BREAKPOINT — Đổi viewport tại runtime (Desktop ➔ Mobile)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("🔄 Neko Header Navigation - Chuyển viewport động @read", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test.describe.configure({ timeout: 60_000 });

  test("TC_05: Đổi viewport từ Desktop (1280x800) sang Mobile (375x667) — Hamburger xuất hiện, Nav Link trực tiếp biến mất và Drawer mở được", async ({
    headerNavPage,
  }) => {
    // 1. Khởi động ở Desktop: Nav Link trực tiếp hiển thị
    await headerNavPage.navigate("/");
    await headerNavPage.expectDesktopHeaderContract();

    // 2. Thu nhỏ viewport xuống Mobile (KHÔNG reload trang) → POM tự chuyển nhánh
    //    locator nhờ Inline Colocated Ternary (`this.isMobile()` được đánh giá lại
    //    tại đúng thời điểm gọi `this.element(...)`)
    await headerNavPage.page.setViewportSize({ ...MOBILE_VIEWPORT });

    // 3. Header Mobile xuất hiện: Hamburger hiển thị, Nav Link trực tiếp bị ẩn
    await headerNavPage.expectMobileHeaderContract();

    // 4. Drawer mở được và chứa link "Tra cứu đơn" đúng contract
    await headerNavPage.openMobileDrawer();
    await headerNavPage.expectMobileDrawerOpened();
  });
});
