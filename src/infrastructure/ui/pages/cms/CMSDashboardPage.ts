/**
 * ============================================================================
 * CMS DASHBOARD PAGE — POM cho trang Dashboard sau login
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Trang chính sau khi đăng nhập CMS. Cung cấp:
 * - Sidebar navigation (menu, submenu)
 * - User dropdown (profile, logout)
 * - Dashboard verification (page load checks)
 *
 * 📌 KEY PATTERN:
 * - Dùng CMSSidebarMenu component cho sidebar navigation
 * - User dropdown: click → show profile/logout links
 *
 * 🔗 LIÊN KẾT:
 * - Dùng: CMSSidebarMenu component
 * - Fixture: cms/ui/app.fixture.ts (dashboardPage)
 * - Extends: BasePage
 */
import { BasePage } from '../base/BasePage';
import { Page, expect } from '@playwright/test';
import { CMSSidebarMenu } from '@components/cms/CMSSidebarMenu';

export class CMSDashboardPage extends BasePage {
  get sidebarMenu() { return new CMSSidebarMenu(this.page); }

  private readonly pageLocators = {
    // Sidebar
    sidebar: '.aiz-sidebar',
    sidebarLogo: (page: Page) => page.locator('.aiz-side-nav-logo-wrap img'),
    menuSearchInput: '#menu-search',
    
    // Topbar
    topbar: '.aiz-topbar',
    userDropdown: (page: Page) =>
      page
        .locator('.aiz-topbar-item')
        .filter({
          has: page
            .locator('.dropdown-toggle.no-arrow.text-dark')
            .filter({ has: page.locator('span.fw-500') }),
        })
        .first(),
    userName: (page: Page) => page.locator('.aiz-topbar-item .fw-500').first(),
    userRole: (page: Page) => page.locator('.aiz-topbar-item .small.opacity-60').first(),
    logoutLink: (page: Page) => page.getByRole('link', { name: 'Logout' }),
    profileLink: (page: Page) => page.getByRole('link', { name: 'Profile' }),
    dashboardTopbarMenu: (page: Page) =>
      page.locator('.aiz-topbar-menu').filter({ hasText: 'Dashboard' }).first(),
  } as const;

  public element = this.createLocatorGetter(this.pageLocators);

  /**
   * Verify dashboard page đã load đúng
   */
  async expectOnPage(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/login/);
    await expect(this.element('sidebar')).toBeVisible();
    await expect(this.element('topbar')).toBeVisible();
    await expect(this.element('sidebarLogo')).toBeVisible();
    await expect(this.element('dashboardTopbarMenu')).toBeVisible();
    await expect(this.element('userDropdown')).toBeVisible();
  }

  /**
   * Navigate đến dashboard page
   */
  async goto() {
    await this.navigateTo('/admin');
  }

  /**
   * Click vào menu item trong sidebar
   * 
   * @param menuText - Text của menu item
   */
  async navigateToMenu(menuText: string) {
    await this.sidebarMenu.clickMenuItem(menuText);
  }

  /**
   * Click vào submenu item
   * 
   * @param parentMenuText - Text của menu cha
   * @param subMenuText - Text của submenu
   */
  async navigateToSubMenu(parentMenuText: string, subMenuText: string) {
    await this.sidebarMenu.clickSubMenuItem(parentMenuText, subMenuText);
  }

  /**
   * Logout khỏi CMS
   */
  async logout() {
    await this.element('userDropdown').click();
    await this.clickWithLog(this.element('logoutLink'));
  }

  /**
   * Navigate đến profile page
   */
  async goToProfile() {
    await this.element('userDropdown').click();
    await this.clickWithLog(this.element('profileLink'));
  }

  /**
   * Verify user đã login với tên cụ thể
   * 
   * @param expectedUserName - Tên user mong đợi
   */
  async expectLoggedInAs(expectedUserName: string) {
    await expect(this.element('userName')).toContainText(expectedUserName);
  }
}
