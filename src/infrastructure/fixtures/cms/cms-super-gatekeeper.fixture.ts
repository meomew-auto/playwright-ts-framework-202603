import {
  cmsAuth,
  type CMSAuthTestFixtures,
  type CMSAuthWorkerFixtures,
} from './cms-auth.fixture';
import {
  cmsAppFixtures,
  type CMSAppFixtures,
} from './cms-app.fixture';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🛡️ CMS SUPER GATEKEEPER FIXTURE (HỢP NHẤT UI POM & WORKER SCOPE RAM SNAPSHOT)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Single Entrypoint hợp nhất toàn bộ fixtures của CMS eCommerce:
 * 1. Tầng Xác Thực Siêu Tốc (cms-auth.fixture.ts):
 *    - workerCmsAdminSnapshot: Nạp và lưu trữ Cookie trong RAM của Worker tiến trình (0ms)
 *    - context.addCookies: Tiêm Cookie vào Browser Context tự động (0ms)
 *    - authedPage: Page có sẵn session đăng nhập
 *    - loginPage: CMSLoginPage
 *
 * 2. Tầng UI Page Objects POM (cms-app.fixture.ts):
 *    - dashboardPage: CMSDashboardPage
 *    - allProductsPage: CMSAllProductsPage
 *    - addNewProductPage: CMSAddNewProductPage
 *
 * 🎯 100% Strict Type Safety — Mọi kịch bản CMS chỉ cần import { test, expect } từ @fixtures/cms!
 */

export type {
  CMSAuthTestFixtures,
  CMSAuthWorkerFixtures,
  WorkerCmsAdminSnapshot,
  CMSCookie,
} from './cms-auth.fixture';
export type { CMSAppFixtures } from './cms-app.fixture';

// Hợp nhất kiểu dữ liệu của toàn bộ CMS
export type CMSSuperTestFixtures = CMSAuthTestFixtures & CMSAppFixtures;
export type CMSSuperWorkerFixtures = CMSAuthWorkerFixtures;

// Hợp nhất các tầng fixture vào test runner duy nhất
export const test = cmsAuth.extend<CMSSuperTestFixtures, CMSSuperWorkerFixtures>({
  ...cmsAppFixtures,
});

export { expect } from '@playwright/test';
