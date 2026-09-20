import { Page, expect } from "@playwright/test";
import { BasePage } from "../base/BasePage";
import { ViewportType } from "@fixtures/common/ViewportType";
import { EnvManager } from "@utils/EnvManager";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🧭 NEKO COFFEE HEADER NAVIGATION PAGE (PAGE OBJECT MODEL)
 * ════════════════════════════════════════════════════════════════════════════
 * Quản lý điều hướng thanh Header Neko Coffee (https://coffee.autoneko.com)
 * theo kiến trúc **Responsive Locators — Inline Colocated Ternary**.
 *
 * 🔎 GROUND TRUTH (khảo sát trực tiếp môi trường LIVE — 2026-09-20):
 * - Desktop (1280x800): link "Tra cứu đơn" là Nav Link TRỰC TIẾP trên thanh
 *   Header, `data-testid="header-nav-order-tracking"`, `href="/vi/order-tracking"`.
 *   Nút Hamburger `header-button-mobile-menu` VẪN tồn tại trong DOM nhưng bị ẩn
 *   bằng CSS Tailwind `lg:hidden` ⇒ KHÔNG thể dùng `locator.or()`.
 * - Mobile (375x667): Nav Desktop bị ẩn bằng `hidden lg:flex` (vẫn nằm trong DOM),
 *   nút Hamburger `header-button-mobile-menu` hiển thị và mở Drawer.
 * - Drawer mobile KHÔNG có `role="dialog"`, KHÔNG có `aside` và container cũng
 *   KHÔNG có `data-testid`: là `div.fixed … z-[9999]` chứa `nav.p-4.space-y-1`
 *   với các link testid `mobile-nav-*`.
 *   ⚠️ Link "Tra cứu đơn" TRONG DRAWER **KHÔNG có `data-testid`** ⇒ phải bám
 *   semantic name (`getByRole("link", { name: "Tra cứu đơn" })`). Đã chứng minh
 *   KHÔNG trùng với Nav Desktop: nav Desktop là `display:none` nên bị loại khỏi
 *   Accessibility Tree ⇒ số match luôn = 1 (không Strict Mode Violation).
 * - Ngưỡng responsive thật của site là Tailwind `lg` (1024px) ⇒ khớp mặc định
 *   `mobileBreakpoint = 1024` của BasePage, KHÔNG cần override.
 * - Trang đích SPA `/vi/order-tracking` render H1 "Tra cứu đơn hàng" + 2 trường
 *   ("Mã đơn hàng", "Số điện thoại hoặc Email") + nút "Tra cứu ngay".
 *
 * 🔗 LIÊN KẾT:
 * - Fixture: `headerNavPage` (gắn với `guestPage` sạch — Zero Auth)
 * - Spec: src/presentation/tests/neko/04-ui/responsive-navigation.spec.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// UI CONTRACT — Nguồn sự thật duy nhất (spec import lại, KHÔNG hardcode copy)
// ─────────────────────────────────────────────────────────────────────────────

/** Đường dẫn tương đối của trang Tra cứu đơn hàng (Next.js i18n routing) */
export const NEKO_ORDER_TRACKING_PATH = "/vi/order-tracking";
/** Nhãn link điều hướng "Tra cứu đơn" (Header Desktop & Drawer Mobile) */
export const NEKO_ORDER_TRACKING_LINK_LABEL = "Tra cứu đơn";
/** Tiêu đề H1 của trang đích Tra cứu đơn hàng */
export const NEKO_ORDER_TRACKING_HEADING = "Tra cứu đơn hàng";
/** Nhãn trường nhập mã đơn hàng */
export const NEKO_ORDER_CODE_LABEL = "Mã đơn hàng";
/** Nhãn trường nhập số điện thoại hoặc email */
export const NEKO_PHONE_OR_EMAIL_LABEL = "Số điện thoại hoặc Email";
/** Nhãn nút submit hành động tra cứu */
export const NEKO_TRACKING_SUBMIT_LABEL = "Tra cứu ngay";
/** `data-testid` nút Hamburger (ẩn `lg:hidden` trên Desktop, hiện trên Mobile) */
export const NEKO_HEADER_MOBILE_MENU_TESTID = "header-button-mobile-menu";
/** `data-testid` Nav Link "Tra cứu đơn" trực tiếp trên Header Desktop */
export const NEKO_HEADER_NAV_ORDER_TRACKING_TESTID = "header-nav-order-tracking";
/** `data-testid` mốc nhận diện DUY NHẤT `<nav>` bên trong Drawer Mobile */
export const NEKO_HEADER_MOBILE_NAV_HOME_TESTID = "mobile-nav-home";
/** Pattern URL tuyệt đối của trang đích (assert chính xác `/vi/order-tracking`) */
export const NEKO_ORDER_TRACKING_URL_PATTERN = new RegExp(
  `${NEKO_ORDER_TRACKING_PATH.replace(/\//g, "\\/")}/?$`,
);

export class NekoHeaderNavigationPage extends BasePage {
  /**
   * Locator Map Pattern — toàn bộ locator tập trung tại đây (Zero raw locator).
   *
   * ⚠️ TUYỆT ĐỐI KHÔNG dùng `locator.or()`: ở MỌI viewport, DOM đều chứa đồng
   * thời Nav Desktop lẫn nút Hamburger (Tailwind ẩn/hiện bằng `hidden lg:flex` /
   * `lg:hidden`) ⇒ `.or()` sẽ crash ngay bằng Strict Mode Violation
   * (`resolved to 2 elements`). Bắt buộc dùng Inline Colocated Ternary với
   * lexical `this.isMobile()` ngay trong từng arrow function của map này.
   */
  private readonly pageLocators = {
    // 🍔 Hamburger: phần tử THẬT duy nhất ở cả 2 viewport (chỉ ẩn/hiện bằng CSS)
    // ⇒ không cần ternary, nhưng không bao giờ được dùng để click ở Desktop.
    mobileMenuButton: (page: Page) =>
      page.getByTestId(NEKO_HEADER_MOBILE_MENU_TESTID),

    // 🗂️ Drawer Mobile: nhận diện qua cây `<nav>` chứa mốc `mobile-nav-home`
    // (nav Desktop không chứa mốc này ⇒ luôn phân giải đúng 1 phần tử).
    mobileDrawer: (page: Page) => this.mobileDrawerScope(page),

    // 🎯 RESPONSIVE (Desktop vs Mobile) — Inline Colocated Ternary:
    //    Desktop → Nav Link trực tiếp trên Header | Mobile → Link trong Drawer.
    orderTrackingLink: (page: Page) =>
      this.isMobile()
        ? this.mobileDrawerScope(page).getByRole("link", {
            name: NEKO_ORDER_TRACKING_LINK_LABEL,
            exact: true,
          })
        : page.getByTestId(NEKO_HEADER_NAV_ORDER_TRACKING_TESTID),

    // 📌 Trỏ thẳng vào Nav Link Desktop (kể cả khi nó bị CSS ẩn trên Mobile)
    // — dùng để CHỨNG MINH phần tử Desktop vẫn tồn tại trong DOM.
    desktopOrderTrackingLink: (page: Page) =>
      page.getByTestId(NEKO_HEADER_NAV_ORDER_TRACKING_TESTID),

    // 🎯 Landing Contract — Trang Tra cứu đơn hàng (/vi/order-tracking)
    orderTrackingHeading: (page: Page) =>
      page.getByRole("heading", { level: 1, name: NEKO_ORDER_TRACKING_HEADING }),
    orderCodeInput: (page: Page) => page.getByLabel(NEKO_ORDER_CODE_LABEL),
    phoneOrEmailInput: (page: Page) =>
      page.getByLabel(NEKO_PHONE_OR_EMAIL_LABEL),
    submitTrackingButton: (page: Page) =>
      page.getByRole("button", { name: NEKO_TRACKING_SUBMIT_LABEL }),
  };

  public element = this.createLocatorGetter(this.pageLocators);

  constructor(page: Page, viewportType: ViewportType = "desktop") {
    super(page, viewportType);
  }

  /**
   * Phạm vi Drawer Mobile — dùng chung cho locator container & link bên trong.
   * Bám mốc `data-testid="mobile-nav-home"`: chỉ tồn tại duy nhất trong Drawer.
   */
  private mobileDrawerScope(page: Page) {
    return page
      .locator("nav")
      .filter({ has: page.getByTestId(NEKO_HEADER_MOBILE_NAV_HOME_TESTID) });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 🧭 NAVIGATION & ACTIONS
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Điều hướng tới trang chủ Neko Coffee (hoặc đường dẫn chỉ định).
   * Base URL lấy từ `NEKO_UI_URL` → `NEKO_UI_ORIGIN`.
   */
  async navigate(path: string = "/"): Promise<void> {
    const baseUrl = EnvManager.get(
      "NEKO_UI_URL",
      EnvManager.get("NEKO_UI_ORIGIN", "https://coffee.autoneko.com"),
    );
    const targetUrl = path.startsWith("http")
      ? path
      : `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
    await this.page.goto(targetUrl);

    // Chờ bundle JS tải xong để React hydration hoàn tất trước khi click:
    // tránh race "click vào link SSR chưa gắn handler" khi chạy song song.
    await this.page.waitForLoadState("load").catch(() => undefined);
    await this.expectOnPage();
  }

  /** Alias tương thích ngược cho `navigate()` */
  async goto(path: string = "/"): Promise<void> {
    await this.navigate(path);
  }

  /**
   * Verify Header hiện tại render đúng theo viewport:
   * - Desktop: Nav Link "Tra cứu đơn" TRỰC TIẾP trên Header.
   * - Mobile: nút Hamburger sẵn sàng mở Drawer.
   */
  async expectOnPage(): Promise<void> {
    // Ở MỌI viewport, cả 2 phần tử đều nằm trong DOM (Tailwind chỉ ẩn/hiện bằng CSS)
    await expect(this.element("mobileMenuButton")).toBeAttached({
      timeout: 15000,
    });
    await expect(this.element("desktopOrderTrackingLink")).toBeAttached({
      timeout: 15000,
    });

    if (this.isMobile()) {
      await expect(this.element("mobileMenuButton")).toBeVisible({
        timeout: 15000,
      });
    } else {
      await expect(this.element("desktopOrderTrackingLink")).toBeVisible({
        timeout: 15000,
      });
    }
  }

  /**
   * Mở Drawer Menu trên Mobile (idempotent — không toggle đóng/mở ngoài ý muốn).
   * Trên Desktop: no-op (không có Drawer).
   */
  async openMobileDrawer(): Promise<void> {
    if (!this.isMobile()) return;
    if (await this.isMobileDrawerOpen()) return;
    await this.clickWithLog(this.element("mobileMenuButton"));
    await expect(this.element("mobileDrawer")).toBeVisible({ timeout: 15000 });
  }

  /** Alias tương thích ngược: mở menu nếu đang ở Mobile */
  async openMenuIfMobile(): Promise<void> {
    await this.openMobileDrawer();
  }

  /**
   * 🎯 Điều phối luồng điều hướng tới `/vi/order-tracking`:
   * - Desktop: click Nav Link trực tiếp (không qua Drawer).
   * - Mobile: mở Drawer → click link "Tra cứu đơn" bên trong.
   */
  async goToOrderTracking(): Promise<void> {
    await this.openMobileDrawer();
    await this.clickWithLog(this.element("orderTrackingLink"));
    await this.page.waitForURL(NEKO_ORDER_TRACKING_URL_PATTERN, {
      timeout: 20000,
    });
  }

  /** Trạng thái Drawer Mobile hiện tại (dựa trên container Drawer có hiển thị không) */
  private async isMobileDrawerOpen(): Promise<boolean> {
    return this.element("mobileDrawer")
      .isVisible()
      .catch(() => false);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ✅ SEMANTIC VERIFICATIONS (spec chỉ orchestrate, KHÔNG chạm selector)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * 🖥️ Header Contract trên Desktop:
   * - Nav Link "Tra cứu đơn" hiển thị TRỰC TIẾP trên Header (đúng nhãn + href).
   * - Nút Hamburger mobile VẪN nằm trong DOM nhưng KHÔNG hiển thị
   *   ⇒ minh chứng cho việc phải dùng ternary thay vì `locator.or()`.
   */
  async expectDesktopHeaderContract(): Promise<void> {
    const desktopLink = this.element("desktopOrderTrackingLink");
    await expect(desktopLink).toBeVisible({ timeout: 15000 });
    await this.verifyTextValues([
      { locator: desktopLink, expected: NEKO_ORDER_TRACKING_LINK_LABEL },
    ]);
    await expect(desktopLink).toHaveAttribute("href", /\/vi\/order-tracking\/?$/);

    await expect(this.element("mobileMenuButton")).toBeAttached();
    await expect(this.element("mobileMenuButton")).not.toBeVisible();
  }

  /**
   * 📱 Header Contract trên Mobile:
   * - Nút Hamburger `header-button-mobile-menu` hiển thị.
   * - Nav Link Desktop bị CSS ẩn NHƯNG vẫn tồn tại trong DOM (`toHaveCount(1)`).
   * - Khi CHƯA mở Drawer: link "Tra cứu đơn" không thể truy cập.
   */
  async expectMobileHeaderContract(): Promise<void> {
    await expect(this.element("mobileMenuButton")).toBeVisible({
      timeout: 15000,
    });

    const desktopLink = this.element("desktopOrderTrackingLink");
    await expect(desktopLink).toHaveCount(1);
    await expect(desktopLink).not.toBeVisible();

    await expect(this.element("mobileDrawer")).toBeHidden();
    await expect(this.element("orderTrackingLink")).toBeHidden();
  }

  /**
   * 🗂️ Drawer Contract trên Mobile (sau khi mở):
   * container Drawer hiển thị + link "Tra cứu đơn" đúng nhãn & href.
   */
  async expectMobileDrawerOpened(): Promise<void> {
    await expect(this.element("mobileDrawer")).toBeVisible({ timeout: 15000 });

    const drawerLink = this.element("orderTrackingLink");
    await expect(drawerLink).toBeVisible({ timeout: 15000 });
    await this.verifyTextValues([
      { locator: drawerLink, expected: NEKO_ORDER_TRACKING_LINK_LABEL },
    ]);
    await expect(drawerLink).toHaveAttribute("href", /\/vi\/order-tracking\/?$/);
  }

  /** Đã chuyển hướng URL chính xác tới `/vi/order-tracking` */
  async expectNavigatedToOrderTracking(): Promise<void> {
    await expect(this.page).toHaveURL(NEKO_ORDER_TRACKING_URL_PATTERN, {
      timeout: 20000,
    });
  }

  /**
   * ✅ Landing Contract của trang đích (SPA render phía client):
   * URL `/vi/order-tracking` + H1 "Tra cứu đơn hàng" + 2 trường nhập liệu
   * + nút "Tra cứu ngay". Chặn bẫy "đổi URL nhưng React chưa hydrate".
   */
  async expectOnOrderTrackingPage(): Promise<void> {
    await this.expectNavigatedToOrderTracking();
    await this.verifyTextValues([
      {
        locator: this.element("orderTrackingHeading"),
        expected: NEKO_ORDER_TRACKING_HEADING,
      },
    ]);
    await expect(this.element("orderCodeInput")).toBeVisible({ timeout: 15000 });
    await expect(this.element("phoneOrEmailInput")).toBeVisible({
      timeout: 15000,
    });
    await expect(this.element("submitTrackingButton")).toBeVisible({
      timeout: 15000,
    });
  }

  // ── Alias tương thích ngược (tên API cũ đã dùng ở các bài giảng trước) ──

  /** @deprecated Dùng `expectMobileHeaderContract()` / `expectDesktopHeaderContract()` */
  async expectMenuButtonVisible(): Promise<void> {
    await expect(this.element("mobileMenuButton")).toBeVisible({
      timeout: 15000,
    });
  }

  /** @deprecated Dùng `expectDesktopHeaderContract()` / `expectMobileDrawerOpened()` */
  async expectOrderTrackingVisible(): Promise<void> {
    await expect(this.element("orderTrackingLink")).toBeVisible({
      timeout: 15000,
    });
  }

  /** @deprecated Dùng `expectDesktopHeaderContract()` */
  async expectDesktopOrderTrackingLinkContract(): Promise<void> {
    await this.expectDesktopHeaderContract();
  }
}

