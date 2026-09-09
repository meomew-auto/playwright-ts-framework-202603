/**
 * ============================================================================
 * CMS LOGIN PAGE — POM cho trang đăng nhập CMS eCommerce
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Automate form login: email, password, remember me, forgot password.
 * URL: /login
 *
 * 📌 SỬ DỤNG:
 * - CMSAuthProvider.loginViaUI() gọi page này để login qua browser
 * - auth.setup.ts dùng để tạo session cookies trước khi chạy tests
 * - Sau login, redirect ra khỏi /login → dashboard
 *
 * 🔗 LIÊN KẾT:
 * - Dùng bởi: CMSAuthProvider.ts (loginViaUI method)
 * - Extends: BasePage (locator getter, logging)
 */
import { expect, Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class CMSLoginPage extends BasePage {
  private readonly pageLocators = {
    emailInput: '#email',
    passwordInput: '#password',
    loginButton: (page: Page) => page.getByRole('button', { name: 'Login' }),
    rememberMeCheckbox: 'input[name="remember"]',
    rememberMeLabel: (page: Page) =>
      page.locator('label.aiz-checkbox').filter({
        has: page.locator('input[name="remember"]'),
      }),
    forgotPasswordLink: (page: Page) => page.getByRole('link', { name: 'Forgot password?' }),
    heading: (page: Page) => page.getByRole('heading', { name: 'Welcome to eCommerce CMS' }),
    welcomeText: (page: Page) => page.getByText('Login to your account.'),

    // Toast notification lỗi
    errorNotification: '.aiz-notify [data-notify="message"]',

    // Inline validation error (class is-invalid)
    emailError: '#email + .invalid-feedback',
    passwordError: '#password + .invalid-feedback',
  } as const;

  public element = this.createLocatorGetter(this.pageLocators);

  async goto() {
    await this.navigateTo('/login');
  }

  async expectOnPage(): Promise<void> {
    await expect(this.element('emailInput')).toBeVisible();
    await expect(this.element('passwordInput')).toBeVisible();
    await expect(this.element('heading')).toBeVisible();
    await expect(this.element('welcomeText')).toBeVisible();
    await expect(this.page).toHaveURL(/\/login/);
  }

  async login(email: string, password: string, rememberMe: boolean = false) {
    await this.fillWithLog(this.element('emailInput'), email);
    await this.fillWithLog(this.element('passwordInput'), password, {
      isSensitive: true,
      fillOptions: { timeout: 10000 },
    });

    if (rememberMe) {
      // Click vào label thay vì checkbox vì checkbox bị che bởi span element
      await this.element('rememberMeLabel').click();
    }

    await this.clickWithLog(this.element('loginButton'), { timeout: 10000 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📍 ASSERTION METHODS — Xác minh trạng thái sau login
  // ═══════════════════════════════════════════════════════════════════════════

  /** Xác minh đăng nhập thành công và chuyển hướng tới trang Admin */
  async expectLoggedIn() {
    await this.page.waitForURL(/\/admin(?!\/login)/, { timeout: 10000 });
    await expect(this.page).toHaveURL(/\/admin/);
  }

  /** Xác minh vẫn ở trang đăng nhập (dùng cho negative tests) */
  async expectStillOnLoginPage() {
    await expect(this.page).toHaveURL(/\/login/);
  }

  /**
   * Xác minh thông báo lỗi server hiển thị (toast notification).
   * Dùng cho: wrong email, wrong password, SQL injection, ...
   * @param expectedText — text mong đợi trong thông báo lỗi
   */
  async expectErrorNotification(expectedText: string) {
    const notification = this.element('errorNotification');
    await expect(notification).toBeVisible({ timeout: 10000 });
    await expect(notification).toContainText(expectedText);
  }

  /**
   * Xác minh field validation inline (server trả về is-invalid class).
   * Dùng cho: empty fields, invalid email format, ...
   * Kiểm tra input có class is-invalid và vẫn ở trang login.
   */
  async expectFieldValidationError(email: string, password: string) {
    await this.expectStillOnLoginPage();

    if (email === '' || !email.includes('@')) {
      await expect(this.element('emailInput')).toHaveClass(/is-invalid/);
    }
    if (password === '') {
      await expect(this.element('passwordInput')).toHaveClass(/is-invalid/);
    }
  }

  async clickForgotPassword() {
    await this.clickWithLog(this.element('forgotPasswordLink'));
  }

  /** Xác minh điều hướng tới trang quên mật khẩu */
  async expectOnForgotPasswordPage() {
    await expect(this.page).toHaveURL(/ecommerce\.anhtester\.com\/password\/reset/);
  }
}
