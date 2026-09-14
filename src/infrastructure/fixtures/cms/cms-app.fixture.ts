import { TestInfo } from '@playwright/test';
import { CMSAuthTestFixtures } from './cms-auth.fixture';
import { CMSAllProductsPage } from '@pages/cms/CMSAllProductsPage';
import { CMSDashboardPage } from '@pages/cms/CMSDashboardPage';
import { CMSAddNewProductPage } from '@pages/cms/CMSAddNewProductPage';
import { BasePage } from '@pages/base/BasePage';
import { Logger } from '@utils/Logger';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🖥️ CMS APP FIXTURE — Page Object Model fixtures cho CMS UI tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Cung cấp các Page Objects đã kết nối sẵn với Browser Page (được tiêm Cookie từ RAM).
 * Tự động gắn nhãn testLabel cho song song logging và điều hướng sẵn sàng.
 */

export interface CMSAppFixtures {
  dashboardPage: CMSDashboardPage;
  allProductsPage: CMSAllProductsPage;
  addNewProductPage: CMSAddNewProductPage;
}

type AppDeps = CMSAuthTestFixtures;

/**
 * Trích xuất TC label từ test title (VD: "TC_02: Điền thông tin..." → "TC_02")
 */
function extractTestLabel(testInfo: TestInfo): string {
  const match = testInfo.title.match(/^(TC_\d+)/);
  return match ? match[1] : testInfo.title.slice(0, 20);
}

/** Gắn testLabel cho POM để phục vụ log correlation khi chạy song song */
function setTestLabel(page: BasePage, testInfo: TestInfo) {
  page.testLabel = extractTestLabel(testInfo);
}

export const cmsAppFixtures = {
  /**
   * Dashboard page — trang chủ quản trị CMS sau khi login
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
   * All Products page — trang danh sách sản phẩm
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
   * Add New Product page — form tạo mới sản phẩm
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
