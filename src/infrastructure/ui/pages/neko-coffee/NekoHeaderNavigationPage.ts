import { Page, expect } from "@playwright/test";
import { BasePage } from "../base/BasePage";
import { ViewportType } from "@fixtures/common/ViewportType";
import { EnvManager } from "@utils/EnvManager";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🧭 NEKO HEADER NAVIGATION PAGE (PAGE OBJECT MODEL)
 * ════════════════════════════════════════════════════════════════════════════
 * Quản lý tương tác và điều hướng thanh Header Neko Coffee với kiến trúc
 * Responsive Locators (Inline Colocated Ternary Pattern):
 * - Desktop: Navigation links trực tiếp trên thanh Header.
 * - Mobile: Nút Hamburger Drawer Menu, mở Drawer trước khi truy cập link.
 */
export class NekoHeaderNavigationPage extends BasePage {
  /**
   * Định nghĩa locators bằng cú pháp Inline Colocated Ternary
   * Khắc phục hoàn toàn lỗi Playwright Strict Mode Violation (resolved to 2 elements)
   * khi cả 2 elements Desktop và Mobile cùng tồn tại trong DOM (CSS display toggling).
   */
  private readonly pageLocators = {
    // 🎯 Nút menu điều hướng: Mobile là Hamburger button, Desktop là header button relative
    menuButton: (page: Page) =>
      this.isMobile()
        ? page.getByTestId("header-button-mobile-menu")
        : page.locator("header button.lg\\:relative"),

    menuTrigger: (page: Page) =>
      this.isMobile()
        ? page.getByTestId("header-button-mobile-menu")
        : page.locator("header button.lg\\:relative"),

    // 🎯 Link tra cứu đơn: Desktop là Nav Link trực tiếp, Mobile là Link trong Drawer Menu
    orderTrackingLink: (page: Page) =>
      this.isMobile()
        ? page
            .locator("aside a, div[role='dialog'] a, .space-y-1 a")
            .filter({ hasText: "Tra cứu đơn" })
        : page.getByTestId("header-nav-order-tracking"),
  };

  public element = this.createLocatorGetter(this.pageLocators);

  constructor(page: Page, viewportType: ViewportType = "desktop") {
    super(page, viewportType);
  }

  /**
   * Điều hướng trực tiếp tới trang chủ hoặc đường dẫn chỉ định
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
    await this.expectOnPage();
  }

  async goto(path: string = "/"): Promise<void> {
    await this.navigate(path);
  }

  /**
   * Xác thực trang hiện tại đang hiển thị thành phần Header tương ứng với Viewport
   */
  async expectOnPage(): Promise<void> {
    if (this.isMobile()) {
      await expect(this.element("menuButton")).toBeVisible({ timeout: 10000 });
    } else {
      await expect(this.element("orderTrackingLink")).toBeVisible({
        timeout: 10000,
      });
    }
  }

  /**
   * Mở Menu Drawer nếu đang ở chế độ Mobile
   */
  async openMenuIfMobile(): Promise<void> {
    if (this.isMobile()) {
      const isLinkVisible = await this.element("orderTrackingLink")
        .isVisible()
        .catch(() => false);
      if (!isLinkVisible) {
        await this.clickWithLog(this.element("menuButton"));
      }
    }
  }

  /**
   * Điều phối luồng chuyển hướng tới trang Tra cứu đơn hàng
   * Tự động mở menu nếu trên Mobile, sau đó click link tra cứu và chờ URL hoàn tất
   */
  async goToOrderTracking(): Promise<void> {
    await this.openMenuIfMobile();
    await this.clickWithLog(this.element("orderTrackingLink"));
    await this.page.waitForURL(/.*\/order-tracking.*/, { timeout: 15000 });
  }

  /**
   * Semantic Verifications
   */
  async expectMenuButtonVisible(): Promise<void> {
    await expect(this.element("menuButton")).toBeVisible({ timeout: 10000 });
  }

  async expectOrderTrackingVisible(): Promise<void> {
    await expect(this.element("orderTrackingLink")).toBeVisible({
      timeout: 10000,
    });
  }

  async expectNavigatedToOrderTracking(): Promise<void> {
    await expect(this.page).toHaveURL(/.*\/order-tracking.*/, {
      timeout: 15000,
    });
  }
}
