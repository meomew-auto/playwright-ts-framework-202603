import { test as base, Page } from "@playwright/test";
import { AuthApiClient } from "../../api/clients/AuthApiClient";
import { ProductApiClient } from "../../api/clients/ProductApiClient";
import { EnvManager } from "../../utils/EnvManager";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🔐 TẦNG XÁC THỰC HYBRID AUTH FIXTURE (WORKER SCOPE RAM & ADDINITSCRIPT)
 * ════════════════════════════════════════════════════════════════════════════
 * Chuyên trách 3 nhiệm vụ tối thượng:
 * 1. Worker-scoped snapshot: Nạp Staff User/Token vào RAM tiến trình Worker (0ms overhead).
 * 2. Test-scoped page override: Tự động tiêm phiên từ RAM vào localStorage qua
 *    context.addInitScript() trước khi bất kỳ script trình duyệt nào nạp.
 * 3. Cung cấp authedStaffClient: API Client đã gắn sẵn token Staff trong RAM.
 */

export interface NekoUserDto {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active?: boolean;
}

export interface WorkerStaffSnapshot {
  token: string;
  email: string;
  user: NekoUserDto;
}

export interface WorkerAdminSnapshot {
  token: string;
  email: string;
  user: NekoUserDto;
}

export interface HybridAuthTestFixtures {
  // Token Staff lấy trực tiếp từ RAM snapshot của worker
  staffToken: string;

  // Client API đã xác thực với Staff token
  authedStaffClient: {
    authApi: AuthApiClient;
    productApi: ProductApiClient;
  };

  // Token Admin lấy trực tiếp từ RAM snapshot của worker (0ms)
  adminToken: string;

  // Client API đã xác thực với Admin token từ RAM
  authedAdminClient: {
    authApi: AuthApiClient;
    productApi: ProductApiClient;
  };

  // Browser Page được tiêm sẵn phiên Admin từ RAM (0ms)
  adminPage: Page;

  /** BrowserContext độc lập sạch 100%, không bị tiêm token hay script của Staff từ RAM */
  guestContext: import("@playwright/test").BrowserContext;

  /** Page sạch bóng dành cho kiểm thử Form Login hoặc luồng Khách vãng lai (Zero Auth) */
  guestPage: Page;
}

export interface HybridAuthWorkerFixtures {
  // Token Staff lưu trong RAM của từng Worker Process
  workerStaffSnapshot: WorkerStaffSnapshot;

  // Token Admin lưu trong RAM của từng Worker Process
  workerAdminSnapshot: WorkerAdminSnapshot;
}

export const hybridAuth = base.extend<
  HybridAuthTestFixtures,
  HybridAuthWorkerFixtures
>({
  // ── 1. WORKER SCOPE: NẠP VÀ LƯU TRỮ TOKEN TRONG RAM CỦA WORKER (0ms) ──
  workerStaffSnapshot: [
    async ({ playwright }, use, workerInfo) => {
      const apiBaseUrl = EnvManager.get(
        "NEKO_API_URL",
        "https://api-neko-coffee.autoneko.com",
      );

      const requestContext = await playwright.request.newContext({
        baseURL: apiBaseUrl,
      });
      const authApi = new AuthApiClient(requestContext);
      const timestamp = Date.now();
      const staffEmail = `staff_w${workerInfo.workerIndex}_${timestamp}@nekocoffee.com`;
      const staffPassword = `StaffPass_${timestamp}!`;

      // Tạo tài khoản Staff cho Worker
      const regRes = await authApi.register({
        username: `staff_w${workerInfo.workerIndex}_${timestamp}`,
        email: staffEmail,
        password: staffPassword,
        role: "staff",
      });

      if (!regRes.ok()) {
        const errorText = await regRes.text().catch(() => "(no body)");
        throw new Error(
          `[SUPER WORKER ${workerInfo.workerIndex}] ❌ Đăng ký Worker Staff qua API thất bại (${regRes.status()}): ${errorText}. Không thể tiếp tục kiểm thử.`,
        );
      }

      const body = await regRes.json();
      const token = body.access_token;
      if (!token) {
        throw new Error(
          `[SUPER WORKER ${workerInfo.workerIndex}] ❌ Phản hồi API đăng ký Staff không chứa access_token hợp lệ.`,
        );
      }

      const user: NekoUserDto = body.user || {
        id: timestamp % 10000,
        username: `staff_w${workerInfo.workerIndex}_${timestamp}`,
        email: staffEmail,
        role: "staff",
        is_active: true,
      };

      console.log(
        `[SUPER WORKER ${workerInfo.workerIndex}] 🚀 Khởi tạo Staff RAM Snapshot: ${staffEmail}`,
      );
      await use({ token, email: staffEmail, user });
      await requestContext.dispose();
      console.log(
        `[SUPER WORKER ${workerInfo.workerIndex}] 📤 Giải phóng Staff RAM Snapshot`,
      );
    },
    { scope: "worker" },
  ],

  // ── 2. TỰ ĐỘNG TIÊM PHIÊN STAFF ĐỘNG TỪ RAM VÀO BROWSER CONTEXT (0ms) ──
  page: async ({ page, context, workerStaffSnapshot }, use) => {
    // Tiêm thẳng token và user object vào localStorage của Browser Context trước khi tải bất kỳ trang nào
    await context.addInitScript(
      ({ token, user }) => {
        localStorage.setItem("access_token", token);
        localStorage.setItem("refresh_token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem(
          "neko_auth",
          JSON.stringify({
            state: {
              user,
              accessToken: token,
              refreshToken: token,
              isAuthenticated: true,
            },
            version: 0,
          }),
        );
      },
      { token: workerStaffSnapshot.token, user: workerStaffSnapshot.user },
    );

    await use(page);
  },

  // ── 3. TOKEN STAFF TRỰC TIẾP TỪ RAM CHO TEST ──
  staffToken: async ({ workerStaffSnapshot }, use) => {
    await use(workerStaffSnapshot.token);
  },

  // ── 4. CLIENT API ĐÃ XÁC THỰC SẴN CHO TEST ──
  authedStaffClient: async (
    { playwright, workerStaffSnapshot },
    use,
  ) => {
    const apiBaseUrl = EnvManager.get(
      "NEKO_API_URL",
      "https://api-neko-coffee.autoneko.com",
    );

    const requestContext = await playwright.request.newContext({
      baseURL: apiBaseUrl,
      extraHTTPHeaders: {
        Authorization: `Bearer ${workerStaffSnapshot.token}`,
      },
    });

    const authApi = new AuthApiClient(
      requestContext,
      workerStaffSnapshot.token,
    );
    const productApi = new ProductApiClient(
      requestContext,
      workerStaffSnapshot.token,
    );

    await use({ authApi, productApi });
    await requestContext.dispose();
  },

  // ── 5. WORKER SCOPE: NẠP VÀ LƯU TRỮ TOKEN ADMIN TRONG RAM CỦA WORKER (0ms) ──
  workerAdminSnapshot: [
    async ({ playwright }, use, workerInfo) => {
      const apiBaseUrl = EnvManager.get(
        "NEKO_API_URL",
        "https://api-neko-coffee.autoneko.com",
      );

      const requestContext = await playwright.request.newContext({
        baseURL: apiBaseUrl,
      });
      const authApi = new AuthApiClient(requestContext);

      const adminUsername = EnvManager.get("NEKO_ADMIN_USERNAME", "admin");
      const adminPassword = EnvManager.get("NEKO_ADMIN_PASSWORD", "Admin@123");

      const loginRes = await authApi.login({
        username: adminUsername,
        password: adminPassword,
      });

      if (!loginRes.ok()) {
        const errorText = await loginRes.text().catch(() => "(no body)");
        throw new Error(
          `[SUPER WORKER ${workerInfo.workerIndex}] ❌ Đăng nhập Admin qua API thất bại (${loginRes.status()}): ${errorText}. Kiểm tra NEKO_ADMIN_USERNAME / NEKO_ADMIN_PASSWORD.`,
        );
      }

      const body = await loginRes.json();
      const token = body.access_token;
      if (!token) {
        throw new Error(
          `[SUPER WORKER ${workerInfo.workerIndex}] ❌ Phản hồi đăng nhập Admin không chứa access_token hợp lệ.`,
        );
      }

      const user: NekoUserDto = body.user || {
        id: 1,
        username: adminUsername,
        email: "admin@nekocoffee.vn",
        role: "admin",
        is_active: true,
      };

      console.log(
        `[SUPER WORKER ${workerInfo.workerIndex}] 👑 Khởi tạo Admin RAM Snapshot: ${user.email} (role: ${user.role})`,
      );
      await use({ token, email: user.email, user });
      await requestContext.dispose();
      console.log(
        `[SUPER WORKER ${workerInfo.workerIndex}] 📤 Giải phóng Admin RAM Snapshot`,
      );
    },
    { scope: "worker" },
  ],

  // ── 6. TOKEN ADMIN TRỰC TIẾP TỪ RAM CHO TEST ──
  adminToken: async ({ workerAdminSnapshot }, use) => {
    await use(workerAdminSnapshot.token);
  },

  // ── 7. CLIENT API ĐÃ XÁC THỰC VỚI ADMIN TOKEN ──
  authedAdminClient: async (
    { playwright, workerAdminSnapshot },
    use,
  ) => {
    const apiBaseUrl = EnvManager.get(
      "NEKO_API_URL",
      "https://api-neko-coffee.autoneko.com",
    );

    const requestContext = await playwright.request.newContext({
      baseURL: apiBaseUrl,
      extraHTTPHeaders: {
        Authorization: `Bearer ${workerAdminSnapshot.token}`,
      },
    });

    const authApi = new AuthApiClient(
      requestContext,
      workerAdminSnapshot.token,
    );
    const productApi = new ProductApiClient(
      requestContext,
      workerAdminSnapshot.token,
    );

    await use({ authApi, productApi });
    await requestContext.dispose();
  },

  // ── 8. BROWSER PAGE TIÊM SẴN PHIÊN ADMIN TRỰC TIẾP TỪ RAM (0ms) ──
  adminPage: async ({ browser, workerAdminSnapshot }, use) => {
    const context = await browser.newContext();
    await context.addInitScript(
      ({ token, user }: { token: string; user: NekoUserDto }) => {
        localStorage.setItem("access_token", token);
        localStorage.setItem("refresh_token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem(
          "neko_auth",
          JSON.stringify({
            state: {
              user,
              accessToken: token,
              refreshToken: token,
              isAuthenticated: true,
            },
            version: 0,
          }),
        );
      },
      { token: workerAdminSnapshot.token, user: workerAdminSnapshot.user },
    );
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // ── 9. PHIÊN TRÌNH DUYỆT KHÁCH VÃNG LAI ĐỘC LẬP (GUEST / CLEAN SESSION) ──
  guestContext: async ({ browser }, use) => {
    // 🔒 BẮT BUỘC ép `storageState` rỗng để có phiên khách THẬT SỰ sạch:
    // Playwright >= 1.63 tự động tiêm `_combinedContextOptions` (kế thừa `test.use()`,
    // bao gồm cả `storageState`) vào MỌI `browser.newContext()` gọi thủ công
    // (xem node_modules/playwright/lib/index.js → runBeforeCreateBrowserContext).
    // Không ép ⇒ "guest context" vẫn dính token của `.auth/<domain>-admin.json`
    // và mọi spec guest/negative sẽ chạy trên phiên ĐÃ đăng nhập (false negative).
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    await use(context);
    await context.close();
  },

  guestPage: async ({ guestContext }, use) => {
    const page = await guestContext.newPage();
    await use(page);
  },
});
