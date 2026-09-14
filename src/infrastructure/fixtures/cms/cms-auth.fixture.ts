import { test as base, Page, BrowserContext } from '@playwright/test';
import { ViewportType } from '../common/ViewportType';
import { CMSLoginPage } from '@pages/cms/CMSLoginPage';
import { cmsAuth as cmsAuthProvider } from '@auth/cms/CMSAuthProvider';
import { EnvManager } from '@utils/EnvManager';
import { Logger } from '@utils/Logger';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚡ CMS AUTH FIXTURE — Worker Scope RAM Snapshot (0ms Auth)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Nạp Session Cookie của CMS Admin vào bộ nhớ RAM của từng Worker Process (0ms).
 * Tiêm trực tiếp Cookie vào BrowserContext trước mỗi test case.
 *
 * 📌 NGUYÊN LÝ HOẠT ĐỘNG (CHUẨN BÀI 24):
 * 1. workerCmsAdminSnapshot ({ scope: 'worker' }):
 *    - Chạy 1 lần duy nhất cho mỗi Worker Process khi worker khởi tạo.
 *    - Tự động kiểm tra / đăng nhập lấy Session Cookie (ecommerce_cms_session).
 *    - Lưu trữ danh sách cookies trực tiếp trên RAM CPU của Worker.
 *
 * 2. page / authedPage ({ scope: 'test' }):
 *    - Mỗi test case được tự động nạp cookies từ RAM qua context.addCookies().
 *    - 0ms lãng phí vào việc đọc/ghi file đĩa trong từng test!
 *
 * 3. guestContext & guestPage:
 *    - Phiên trình duyệt khách vãng lai sạch 100%, không bị tiêm Cookie Admin từ RAM.
 *    - loginPage mặc định gắn vào guestPage để tránh auto-redirect.
 */

export interface CMSCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface WorkerCmsAdminSnapshot {
  cookies: CMSCookie[];
  email: string;
}

export interface CMSAuthTestFixtures {
  /** Page đã được tiêm sẵn Session Cookie từ RAM (0ms) */
  authedPage: Page;
  /** BrowserContext độc lập sạch 100%, không dính cookie từ RAM */
  guestContext: BrowserContext;
  /** Page sạch bóng dành cho kiểm thử Form Login hoặc luồng Khách vãng lai */
  guestPage: Page;
  /** POM trang Login CMS (gắn với guestPage sạch bóng) */
  loginPage: CMSLoginPage;
  /** Alias tường minh cho POM trang Login trên guestPage */
  guestLoginPage: CMSLoginPage;
  /** Loại viewport (desktop / mobile) từ project config */
  viewportType: ViewportType;
}

export interface CMSAuthWorkerFixtures {
  /** Session Cookies được lưu trong RAM của từng Worker tiến trình */
  workerCmsAdminSnapshot: WorkerCmsAdminSnapshot;
}

export const cmsAuth = base.extend<CMSAuthTestFixtures, CMSAuthWorkerFixtures>({
  // ── 1. WORKER SCOPE: NẠP VÀ LƯU COOKIES TRONG RAM WORKER (0ms) ──
  workerCmsAdminSnapshot: [
    async ({ browser }, use, workerInfo) => {
      const email = EnvManager.get('CMS_ADMIN_EMAIL', 'admin@example.com');
      const uiOrigin = EnvManager.get('CMS_UI_ORIGIN', 'https://cms.autoneko.com');

      let cookies: CMSCookie[] = [];

      // Kiểm tra xem đã có storageState hợp lệ sẵn (ví dụ từ setup project) hay cần login
      if (cmsAuthProvider.isStorageStateValid('admin')) {
        const state = cmsAuthProvider.loadStorageState('admin');
        if (state && state.cookies?.length) {
          cookies = state.cookies as CMSCookie[];
          Logger.info(
            `[CMS WORKER ${workerInfo.workerIndex}] ⚡ Nạp CMS Admin Session Cookie từ cache vào RAM (count: ${cookies.length})`,
            { context: 'worker-auth' }
          );
        }
      }

      // Nếu chưa có hoặc cookie hết hạn: Tự động login 1 lần duy nhất cho worker này
      if (!cookies.length) {
        Logger.info(
          `[CMS WORKER ${workerInfo.workerIndex}] 🔐 Khởi tạo CMS Admin Session qua Browser UI: ${email}`,
          { context: 'worker-auth' }
        );
        const setupContext = await browser.newContext({ baseURL: uiOrigin });
        const setupPage = await setupContext.newPage();

        try {
          const loginPage = new CMSLoginPage(setupPage);
          await cmsAuthProvider.loginViaUI(setupPage, 'admin', loginPage);
          cookies = (await setupContext.cookies()) as CMSCookie[];
        } finally {
          await setupContext.close();
        }
      }

      console.log(
        `[CMS WORKER ${workerInfo.workerIndex}] 👑 CMS Admin RAM Snapshot sẵn sàng (${cookies.length} cookies)`
      );

      await use({ cookies, email });

      console.log(
        `[CMS WORKER ${workerInfo.workerIndex}] 📤 Giải phóng CMS Admin RAM Snapshot`
      );
    },
    { scope: 'worker' },
  ],

  // ── 2. VIEWPORT TYPE (Inject từ project config) ──
  viewportType: ['desktop' as ViewportType, { option: true }],

  // ── 3. TỰ ĐỘNG TIÊM SESSION COOKIE TỪ RAM VÀO BROWSER CONTEXT CHO MỖI TEST ──
  page: async ({ page, context, workerCmsAdminSnapshot, storageState }, use) => {
    // Nếu test chỉ định guest mode (reset storageState rỗng như login.spec.ts) -> không tiêm cookie
    const isGuestMode = typeof storageState === 'object' && storageState.cookies?.length === 0;
    if (!isGuestMode && workerCmsAdminSnapshot.cookies.length > 0) {
      await context.addCookies(workerCmsAdminSnapshot.cookies);
    }
    await use(page);
  },

  // ── 4. AUTHED PAGE (Đảm bảo phiên luôn được authenticated từ RAM) ──
  authedPage: async ({ page, context, workerCmsAdminSnapshot }, use) => {
    if (workerCmsAdminSnapshot.cookies.length > 0) {
      await context.addCookies(workerCmsAdminSnapshot.cookies);
    }
    await use(page);
  },

  // ── 5. PHIÊN TRÌNH DUYỆT KHÁCH VÃNG LAI ĐỘC LẬP (GUEST / CLEAN SESSION) ──
  guestContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  guestPage: async ({ guestContext }, use) => {
    const page = await guestContext.newPage();
    await use(page);
  },

  // ── 6. LOGIN PAGE POM (Mặc định gắn với guestPage để luôn sạch bóng 100%) ──
  loginPage: async (
    { guestPage, page, viewportType }: { guestPage?: Page; page: Page; viewportType: ViewportType },
    use: (r: CMSLoginPage) => Promise<void>
  ) => {
    const loginPage = new CMSLoginPage(guestPage || page, viewportType);
    await loginPage.goto();
    Logger.info('LoginPage ready (guest session)', { context: 'fixture' });
    await use(loginPage);
  },

  guestLoginPage: async (
    { guestPage, page, viewportType }: { guestPage?: Page; page: Page; viewportType: ViewportType },
    use: (r: CMSLoginPage) => Promise<void>
  ) => {
    const loginPage = new CMSLoginPage(guestPage || page, viewportType);
    await loginPage.goto();
    Logger.info('GuestLoginPage ready (guest session)', { context: 'fixture' });
    await use(loginPage);
  },
});
