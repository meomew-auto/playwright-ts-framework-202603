import { Page, expect, Locator, Response } from "@playwright/test";
import { BasePage } from "../base/BasePage";
import { EnvManager } from "@utils/EnvManager";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * ☕ NEKO COFFEE LOGIN PAGE (PAGE OBJECT MODEL)
 * ════════════════════════════════════════════════════════════════════════════
 * Quản lý toàn bộ tương tác và xác thực trên màn hình Đăng nhập Neko Coffee.
 *
 * 🔎 GROUND TRUTH (khảo sát trực tiếp môi trường LIVE — 2026-09-20):
 * - URL `/login` → server redirect sang `/vi/login` (Next.js i18n routing).
 * - Form dùng `data-testid` chuẩn: `login-form`, `login-input-username`,
 *   `login-input-password`, `login-button-submit`, `login-button-google`.
 * - ⚠️ Trang có TỚI 3 nút `button[type="submit"]` (language-switcher, mobile-menu,
 *   nút Đăng nhập) ⇒ TUYỆT ĐỐI không dùng `button[type="submit"]` làm selector
 *   (Strict Mode Violation). Bắt buộc dùng `data-testid="login-button-submit"`.
 * - 2 trường bắt buộc (`required`) → trình duyệt chặn submit rỗng ngay tại client.
 * - Dialog lỗi KHÔNG có `role`/`data-testid` ⇒ phải bám semantic: Heading H3
 *   "Đăng nhập thất bại" + copy "Tên đăng nhập hoặc mật khẩu không đúng."
 *   + nút "Đóng" (⚠️ KHÁC hoàn toàn với `message` của backend API).
 * - Đăng nhập THÀNH CÔNG: SPA **KHÔNG redirect** (vẫn ở `/vi/login`) mà đổi Header
 *   sang trạng thái đã xác thực (`header-nav-admin` "Quản lý", button tên user,
 *   `header-button-logout`) và ghi token vào `localStorage.access_token`.
 *   ⇒ KHÔNG được assert URL để phán đoán login thành công!
 * - API: `POST https://api-neko-coffee.autoneko.com/auth/login`
 *   → 401 `{ status, code: "UNAUTHORIZED", message: "Sai tên đăng nhập hoặc mật khẩu" }`
 *   → 200 `{ access_token, refresh_token, token_type, expires_in, expires_at, user }`
 */

// ─────────────────────────────────────────────────────────────────────────────
// UI CONTRACT — Nguồn sự thật duy nhất (spec import lại, KHÔNG hardcode copy)
// ─────────────────────────────────────────────────────────────────────────────

/** Đường dẫn tương đối của trang Login (server sẽ redirect sang /vi/login) */
export const NEKO_LOGIN_PATH = "/login";
/** Tiêu đề H1 người dùng nhìn thấy trên form đăng nhập */
export const NEKO_LOGIN_HEADING = "Chào mừng trở lại";
/** Mô tả phụ dưới tiêu đề */
export const NEKO_LOGIN_SUBTITLE =
  "Vui lòng đăng nhập để tiếp tục thưởng thức cà phê.";
/** Placeholder ô tài khoản */
export const NEKO_USERNAME_PLACEHOLDER = "Nhập email hoặc tên đăng nhập";
/** Placeholder ô mật khẩu */
export const NEKO_PASSWORD_PLACEHOLDER = "Nhập mật khẩu";
/** Nhãn nút submit chính */
export const NEKO_LOGIN_SUBMIT_LABEL = "Đăng nhập";
/** Tiêu đề dialog khi đăng nhập thất bại */
export const NEKO_LOGIN_ERROR_TITLE = "Đăng nhập thất bại";
/** Copy hiển thị trên UI — KHÁC message của backend API */
export const NEKO_LOGIN_ERROR_MESSAGE = "Tên đăng nhập hoặc mật khẩu không đúng.";
/** Endpoint backend tiếp nhận đăng nhập (dùng cho Reverse Network Audit) */
export const NEKO_AUTH_LOGIN_ENDPOINT = "/auth/login";
/** Key localStorage chứa JWT access token */
export const NEKO_ACCESS_TOKEN_KEY = "access_token";

export class NekoLoginPage extends BasePage {
  /**
   * Locator Map Pattern — toàn bộ locator tập trung tại đây (Zero raw locator).
   * Ô nhập & nút submit bám `data-testid` để tránh Strict Mode Violation.
   */
  private readonly pageLocators = {
    heading: (page: Page) =>
      page.getByRole("heading", { level: 1, name: NEKO_LOGIN_HEADING }),
    subtitle: (page: Page) => page.getByText(NEKO_LOGIN_SUBTITLE),
    loginForm: (page: Page) => page.getByTestId("login-form"),
    usernameInput: (page: Page) => page.getByTestId("login-input-username"),
    passwordInput: (page: Page) => page.getByTestId("login-input-password"),
    loginButton: (page: Page) => page.getByTestId("login-button-submit"),
    googleLoginButton: (page: Page) => page.getByTestId("login-button-google"),
    rememberMeLabel: (page: Page) =>
      page.getByText("Ghi nhớ tôi", { exact: true }),
    registerLink: (page: Page) => page.getByTestId("header-link-register"),
    guestLoginLink: (page: Page) => page.getByTestId("header-link-login"),

    // 🚨 Dialog lỗi trên site thật KHÔNG có role/testid → bám semantic contract
    errorTitle: (page: Page) =>
      page.getByRole("heading", { level: 3, name: NEKO_LOGIN_ERROR_TITLE }),
    errorMessage: (page: Page) =>
      page.getByText(NEKO_LOGIN_ERROR_MESSAGE, { exact: true }),
    errorCloseButton: (page: Page) => page.getByRole("button", { name: "Đóng" }),

    // 🎯 Header ở trạng thái ĐÃ xác thực (SPA đổi state, KHÔNG redirect)
    adminNavLink: (page: Page) => page.getByTestId("header-nav-admin"),
    logoutButton: (page: Page) => page.getByTestId("header-button-logout"),
    userMenuButton: (page: Page, username: string) =>
      page
        .locator("header")
        .getByRole("button", { name: username, exact: true }),
  };

  public element = this.createLocatorGetter(this.pageLocators);

  constructor(page: Page) {
    super(page);
  }

  /**
   * Điều hướng tới trang Login (base URL lấy từ biến môi trường NEKO_UI_URL)
   */
  async navigate(path: string = NEKO_LOGIN_PATH): Promise<void> {
    const baseUrl = EnvManager.get(
      "NEKO_UI_URL",
      EnvManager.get("NEKO_UI_ORIGIN", "https://coffee.autoneko.com"),
    );
    const targetUrl = path.startsWith("http")
      ? path
      : `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

    await this.page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    // Chờ tài nguyên tải xong (bundle JS) để React hydration hoàn tất trước khi thao tác:
    // tránh race "click vào nút SSR chưa gắn handler" khi chạy song song nhiều worker.
    await this.page.waitForLoadState("load").catch(() => undefined);
    await this.expectOnPage();
  }

  /** Alias tương thích ngược cho `navigate()` */
  async goto(path: string = NEKO_LOGIN_PATH): Promise<void> {
    await this.navigate(path);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VERIFICATIONS
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Xác nhận đã hạ cánh đúng trang Login và các phần tử cốt lõi đã render.
   * ⚠️ Server redirect `/login` → `/vi/login` nên chỉ so khớp hậu tố `/login`.
   */
  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login\/?$/, { timeout: 20000 });
    await expect(this.element("heading")).toBeVisible({ timeout: 20000 });
    await expect(this.element("loginForm")).toBeVisible({ timeout: 20000 });
    await expect(this.element("usernameInput")).toBeVisible({ timeout: 20000 });
    await expect(this.element("passwordInput")).toBeVisible({ timeout: 20000 });
    await expect(this.element("loginButton")).toBeVisible({ timeout: 20000 });
  }

  /**
   * UI Contract của form: tiêu đề, mô tả phụ, 2 trường bắt buộc, placeholder,
   * MASKING mật khẩu và nhãn nút submit.
   */
  async expectLoginFormContract(): Promise<void> {
    await this.verifyTextValues([
      { locator: this.element("heading"), expected: NEKO_LOGIN_HEADING },
      { locator: this.element("subtitle"), expected: NEKO_LOGIN_SUBTITLE },
    ]);

    const username = this.element("usernameInput");
    const password = this.element("passwordInput");

    await expect(username).toHaveAttribute("type", "text");
    await expect(username).toHaveAttribute("required", "");
    await expect(username).toHaveAttribute(
      "placeholder",
      NEKO_USERNAME_PLACEHOLDER,
    );
    // 🔐 Bảo mật: mật khẩu phải bị che (không render dạng text thuần)
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveAttribute("required", "");
    await expect(password).toHaveAttribute(
      "placeholder",
      NEKO_PASSWORD_PLACEHOLDER,
    );

    await expect(this.element("loginButton")).toHaveRole("button");
    await expect(this.element("loginButton")).toHaveText(NEKO_LOGIN_SUBMIT_LABEL);
    await expect(this.element("rememberMeLabel")).toBeVisible();
    await expect(this.element("googleLoginButton")).toBeVisible();
  }

  /**
   * Xác nhận người dùng đang ở phiên KHÁCH (chưa đăng nhập):
   * Header còn "Đăng nhập"/"Đăng ký", chưa có "Quản lý" và chưa có nút Đăng xuất.
   */
  async expectGuestHeaderState(): Promise<void> {
    await expect(this.element("guestLoginLink")).toBeVisible({ timeout: 15000 });
    await expect(this.element("registerLink")).toBeVisible({ timeout: 15000 });
    await expect(this.element("adminNavLink")).toHaveCount(0);
    await expect(this.element("logoutButton")).toHaveCount(0);
  }

  /**
   * Xác nhận dialog "Đăng nhập thất bại" hiển thị đúng copy trên UI.
   * @param message - Copy kỳ vọng (mặc định = NEKO_LOGIN_ERROR_MESSAGE)
   */
  async expectLoginFailureDialog(
    message: string = NEKO_LOGIN_ERROR_MESSAGE,
  ): Promise<void> {
    await expect(this.element("errorTitle")).toBeVisible({ timeout: 15000 });
    await expect(this.element("errorMessage")).toContainText(message);
    await expect(this.element("errorCloseButton")).toBeVisible();
  }

  /** Xác nhận KHÔNG có dialog lỗi nào xuất hiện */
  async expectNoFailureDialog(): Promise<void> {
    await expect(this.element("errorTitle")).toHaveCount(0);
  }

  /**
   * Xác nhận HTML5 `required` đã chặn submit ngay tại client:
   * cả 2 trường đều invalid kèm native validationMessage.
   */
  async expectRequiredValidationBlocked(): Promise<void> {
    const isBlocked = async (locator: Locator) =>
      locator.evaluate((el) => {
        const input = el as HTMLInputElement;
        return !input.checkValidity() && input.validationMessage.length > 0;
      });

    expect(
      await isBlocked(this.element("usernameInput")),
      "❌ Ô tài khoản phải chặn submit bằng HTML5 required (checkValidity = false)",
    ).toBe(true);
    expect(
      await isBlocked(this.element("passwordInput")),
      "❌ Ô mật khẩu phải chặn submit bằng HTML5 required (checkValidity = false)",
    ).toBe(true);
    await expect(this.element("loginForm")).toBeVisible();
  }

  /**
   * Xác nhận KHÔNG có request đăng nhập nào bị gửi đi
   * (dùng chung mảng tích luỹ từ `trackLoginRequests()`).
   */
  expectNoLoginRequestFired(hits: string[]): void {
    expect(
      hits,
      `❌ Form không hợp lệ KHÔNG được gửi request ${NEKO_AUTH_LOGIN_ENDPOINT} (phải bị chặn ở client)`,
    ).toHaveLength(0);
  }

  /**
   * Xác nhận đăng nhập THÀNH CÔNG (SPA KHÔNG redirect):
   * Header chuyển sang trạng thái đã xác thực + hiển thị đúng username + nút Đăng xuất.
   */
  async expectLoginSucceeded(username: string): Promise<void> {
    await expect(this.element("adminNavLink")).toBeVisible({ timeout: 20000 });
    await expect(this.element("userMenuButton")(username)).toBeVisible({
      timeout: 20000,
    });
    await expect(this.element("logoutButton")).toBeAttached();
    await expect(this.element("guestLoginLink")).toHaveCount(0);
  }

  /** Xác nhận form vẫn sẵn sàng cho lần đăng nhập tiếp theo (sau khi đóng dialog lỗi) */
  async expectLoginRetryReady(username: string): Promise<void> {
    await expect(this.element("loginForm")).toBeVisible({ timeout: 15000 });
    await this.fillWithLog(this.element("usernameInput"), username);
    await expect(this.element("usernameInput")).toHaveValue(username);
    await expect(this.element("loginButton")).toBeEnabled();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ───────────────────────────────────────────────────────────────────────────

  /** Điền thông tin đăng nhập (mật khẩu được MASK trong log) */
  async fillCredentials(username: string, password: string): Promise<void> {
    await this.fillWithLog(this.element("usernameInput"), username);
    await this.fillWithLog(this.element("passwordInput"), password, {
      isSensitive: true,
    });
  }

  /** Bấm nút "Đăng nhập" */
  async submit(): Promise<void> {
    await this.clickWithLog(this.element("loginButton"));
  }

  /** Điền form và bấm Đăng nhập (không chờ response) */
  async login(username: string, password: string): Promise<void> {
    await this.fillCredentials(username, password);
    await this.submit();
  }

  /**
   * 🎯 Enterprise Model 4 — Reverse Network Audit:
   * Bấm Đăng nhập và bắt đúng response `POST /auth/login` do hành động UI phát ra.
   */
  async loginAndCaptureResponse(
    username: string,
    password: string,
  ): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (res) =>
          res.url().includes(NEKO_AUTH_LOGIN_ENDPOINT) &&
          res.request().method() === "POST",
        { timeout: 30000 },
      ),
      this.login(username, password),
    ]);
    return response;
  }

  /**
   * Bắt đầu theo dõi mọi request đăng nhập (phục vụ negative test:
   * chứng minh form rỗng KHÔNG gọi API).
   * @returns Mảng tích luỹ URL request — đọc lại SAU khi thao tác xong.
   */
  trackLoginRequests(): string[] {
    const hits: string[] = [];
    this.page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().includes(NEKO_AUTH_LOGIN_ENDPOINT)
      ) {
        hits.push(request.url());
      }
    });
    return hits;
  }

  /** Đóng dialog lỗi và xác nhận dialog đã biến mất */
  async closeFailureDialog(): Promise<void> {
    await this.clickWithLog(this.element("errorCloseButton"));
    await expect(this.element("errorTitle")).toBeHidden({ timeout: 15000 });
  }

  /** Đọc JWT access token mà UI đã lưu vào localStorage (null nếu chưa đăng nhập) */
  async getStoredAccessToken(): Promise<string | null> {
    return this.page.evaluate(
      (key: string) => window.localStorage.getItem(key),
      NEKO_ACCESS_TOKEN_KEY,
    );
  }

  /** Xoá sạch phiên đăng nhập trong localStorage (teardown, chống ô nhiễm state) */
  async clearStoredSession(): Promise<void> {
    await this.page.evaluate(() => {
      ["access_token", "refresh_token", "user", "neko_auth"].forEach((key) =>
        window.localStorage.removeItem(key),
      );
    });
  }
}

