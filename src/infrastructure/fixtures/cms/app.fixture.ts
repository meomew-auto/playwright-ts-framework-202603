/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CMS APP FIXTURE — Page Object Model fixtures cho CMS UI tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Cung cấp POMs (Page Object Models) dưới dạng fixtures.
 * Test chỉ cần khai báo POM cần dùng → Playwright tự khởi tạo.
 *
 * 📌 TẠI SAO EXPORT OBJECT (không phải test.extend)?
 * ```typescript
 * // Export object fixtures riêng → spread vào gatekeeper
 * export const appFixtures = { allProductsPage: async (...) => ... };
 * // Ở gatekeeper:  auth.extend<AppFixtures>({ ...appFixtures })
 * ```
 *
 * 📚 DEPENDENCY INJECTION:
 * Mỗi POM fixture nhận `authedPage` từ auth.fixture.
 * → Playwright tự resolve: auth.fixture trước, rồi mới tạo POMs.
 *
 * 🔗 LIÊN KẾT:
 * - Phụ thuộc: auth.fixture.ts (authedPage, viewportType)
 * - Dùng bởi: gatekeeper.fixture.ts (spread merge)
 * - Import POMs từ: pages/cms/
 */

import { PlaywrightTestArgs, TestInfo } from '@playwright/test';
import { AuthFixtures } from './auth.fixture';
import { ViewportType } from '../common/ViewportType';
import { Logger } from '@utils/Logger';

// Import CMS Page Objects — mỗi POM sẽ thành 1 fixture
import { CMSLoginPage } from '@pages/cms/CMSLoginPage';
import { CMSAllProductsPage } from '@pages/cms/CMSAllProductsPage';
import { CMSDashboardPage } from '@pages/cms/CMSDashboardPage';
import { CMSAddNewProductPage } from '@pages/cms/CMSAddNewProductPage';
import { BasePage } from '@pages/base/BasePage';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type AppFixtures = {
  dashboardPage: CMSDashboardPage;
  allProductsPage: CMSAllProductsPage;
  addNewProductPage: CMSAddNewProductPage;
};

/** Dependencies — Playwright inject các fixtures này tự động */
type AppDeps = PlaywrightTestArgs & AuthFixtures & { viewportType?: ViewportType };

/**
 * Extract TC label từ test title, VD: "TC_02: Điền thông tin..." → "TC_02"
 * Fallback: dùng full title nếu không match pattern TC_XX
 */
function extractTestLabel(testInfo: TestInfo): string {
  const match = testInfo.title.match(/^(TC_\d+)/);
  return match ? match[1] : testInfo.title.slice(0, 20);
}

/** Set testLabel cho POM — dùng cho parallel log identification */
function setTestLabel(page: BasePage, testInfo: TestInfo) {
  page.testLabel = extractTestLabel(testInfo);
}

// ═══════════════════════════════════════════════════════════════════════════
// FIXTURES OBJECT — Export dạng object để spread vào gatekeeper
// ═══════════════════════════════════════════════════════════════════════════

export const appFixtures = {
  /**
   * Dashboard page — trang chính sau login, navigate tự động.
   */
  dashboardPage: async (
    { authedPage, viewportType }: AppDeps,
    use: (r: CMSDashboardPage) => Promise<void>,
    testInfo: TestInfo
  ) => {
    const dashboardPage = new CMSDashboardPage(authedPage, viewportType || 'desktop');
    setTestLabel(dashboardPage, testInfo);
    await dashboardPage.goto();
    Logger.info('DashboardPage ready', { context: 'fixture' });
    await use(dashboardPage);
  },

  /**
   * All Products page — danh sách sản phẩm, navigate + verify tự động.
   */
  allProductsPage: async (
    { authedPage, viewportType }: AppDeps,
    use: (r: CMSAllProductsPage) => Promise<void>,
    testInfo: TestInfo
  ) => {
    const allProductsPage = new CMSAllProductsPage(authedPage, viewportType || 'desktop');
    setTestLabel(allProductsPage, testInfo);
    await allProductsPage.goto();
    await allProductsPage.expectOnPage();
    Logger.info('AllProductsPage ready', { context: 'fixture' });
    await use(allProductsPage);
  },

  /**
   * Add New Product page — form tạo sản phẩm mới, navigate + verify tự động.
   */
  addNewProductPage: async (
    { authedPage, viewportType }: AppDeps,
    use: (r: CMSAddNewProductPage) => Promise<void>,
    testInfo: TestInfo
  ) => {
    const addNewProductPage = new CMSAddNewProductPage(authedPage, viewportType || 'desktop');
    setTestLabel(addNewProductPage, testInfo);
    await addNewProductPage.goto();
    await addNewProductPage.expectOnPage();
    Logger.info('AddNewProductPage ready', { context: 'fixture' });
    await use(addNewProductPage);
  },
};
