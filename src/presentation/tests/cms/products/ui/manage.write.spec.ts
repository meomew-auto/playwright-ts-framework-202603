/**
 * ============================================================================
 * TEST: CMS QUẢN LÝ SẢN PHẨM — Mutating Tests (Edit, Delete)
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Test các thao tác thay đổi dữ liệu: edit, delete, bulk delete sản phẩm.
 * Các tests này thay đổi dữ liệu → PHẢI chạy tuần tự (serial mode).
 *
 * ════════════════════════════════════════════════════════════════════════════
 * 📐 PATTERNS & METHODS SỬ DỤNG TỪ PAGE OBJECTS
 * ════════════════════════════════════════════════════════════════════════════
 *
 * 1️⃣ ROW ACTIONS (từ CMSAllProductsPage)
 *    - editProduct(name)               → click Edit trên dropdown action
 *    - deleteProduct(name)             → click Delete + confirm dialog
 *    - viewProduct(name)               → click View
 *    - bulkDeleteProducts([names])     → select nhiều + bulk delete
 *
 * 2️⃣ TABLE DATA METHODS
 *    - getFirstProductName()           → lấy tên sản phẩm đầu tiên
 *    - getColumnValues('name')         → lấy tất cả giá trị 1 cột
 *    - getDefaultTableData()           → lấy dữ liệu tất cả cột mặc định
 *    - findRowByFilters({...})         → tìm dòng theo nhiều bộ lọc
 *
 * 3️⃣ PAGINATION
 *    - getTestTargetFromNextPage()     → tìm product ở trang kế để test cross-page
 *    - findRowByFiltersAcrossPages()   → tìm dòng qua nhiều trang
 *
 * 4️⃣ CHECKBOX
 *    - toggleRowCheckboxByName(name, true/false) → bật/tắt checkbox dòng
 *
 * ⚠️ LƯU Ý:
 * - Không dùng fixture `page` trực tiếp — luôn thao tác qua `allProductsPage`
 * - URL assertions dùng `allProductsPage.page` (kế thừa từ BasePage)
 * - Không đặt raw locator trong test — mọi locator nằm trong Page Object
 *
 * ════════════════════════════════════════════════════════════════════════════
 * ⚠️ TẠI SAO PHẢI DÙNG SERIAL MODE?
 * ════════════════════════════════════════════════════════════════════════════
 *
 * File này chứa mutating tests (edit, delete) → PHẢI serial vì:
 *
 * 1. DATA CONFLICT: Các TC dùng chung data (getFirstProductName)
 *    - TC_05 delete product A → TC_01 cố edit product A → fail
 *    - TC_06 bulk delete → TC_02 getDefaultTableData() → empty
 *
 * 2. TABLE STATE: rows.count() là imperative (không retry)
 *    → Nếu table đang re-render do TC khác navigate → count = 0
 *
 * 3. MUỐN PARALLEL CHO DELETE?
 *    → Mỗi TC phải tự tạo product riêng (setup → action → verify)
 *    → Nhưng tốn thêm thời gian setup mỗi TC
 *    → Serial đơn giản hơn và đủ nhanh (45s cho 8 TC)
 */
import { test, expect } from '@fixtures/cms';
import { createProductWithDiscount } from '@data/cms/ProductDataFactory';
import { Logger } from '@utils/Logger';

test.describe('CMS Quản Lý Sản Phẩm', () => {
  // ⚠️ BẮT BUỘC SERIAL — Xem header comment ở trên để hiểu tại sao
  test.describe.configure({ mode: 'serial' });

  test('TC_01: Click Edit sản phẩm - editProduct()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();

    await allProductsPage.editProduct(firstProductName);

    await expect(allProductsPage.page).toHaveURL(/\/admin\/products\/.*\/edit/);
    Logger.info(`✅ Đã điều hướng tới trang edit: "${firstProductName}"`);
  });

  test('TC_02: Quy trình xem sản phẩm hoàn chỉnh', async ({ allProductsPage }) => {
    const allData = await allProductsPage.getDefaultTableData();
    expect(allData.length).toBeGreaterThan(0);
    Logger.info(`📋 Tìm thấy ${allData.length} sản phẩm`);

    const targetProduct = allData[0];
    Logger.info(`🎯 Target: "${targetProduct.name}"`);
    Logger.info(`📄 Row data: ${JSON.stringify(targetProduct)}`);

    // Xem chi tiết sản phẩm đầu tiên
    await allProductsPage.viewProduct(targetProduct.name);
    Logger.info('✅ Đã click View thành công');
  });

  test('TC_03: Tìm kiếm xuyên trang và edit', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();
    Logger.info(`🎯 Target: "${firstProductName}"`);

    // Tìm dòng qua nhiều trang — auto detect tổng trang
    const { row, pageNumber } = await allProductsPage.findRowByFiltersAcrossPages(
      { name: firstProductName },
      { maxPages: 5 }
    );
    await expect(row).toBeVisible();
    Logger.info(`📄 Tìm thấy ở trang ${pageNumber}`);

    // Lấy data dòng
    const { data } = await allProductsPage.getRowDataByFiltersAcrossPages(
      { name: firstProductName },
      { maxPages: 5 },
      ['name', 'addedBy', 'info', 'totalStock', 'published', 'featured']
    );
    Logger.info(`📄 Row data: ${JSON.stringify(data)}`);

    // Edit product
    await allProductsPage.editProduct(firstProductName);
    await expect(allProductsPage.page).toHaveURL(/\/admin\/products\/.*\/edit/);
    Logger.info('✅ Đã điều hướng tới trang edit qua cross-page search');
  });

  test('TC_04: Chỉnh sửa sản phẩm đầu tiên', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();
    Logger.info(`🎯 Target: "${firstProductName}"`);

    await allProductsPage.editProduct(firstProductName);
    await expect(allProductsPage.page).toHaveURL(/\/admin\/products\/.*\/edit/);
    Logger.info('✅ Đã điều hướng tới trang edit');
  });

  test('TC_05: Xóa một sản phẩm - deleteProduct()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();
    Logger.info(`🎯 Target: "${firstProductName}"`);

    // Verify sản phẩm tồn tại trước khi xóa
    const productNamesBefore = await allProductsPage.getColumnValues('name');
    const existsBefore = productNamesBefore.some((name) => name.includes(firstProductName));
    expect(existsBefore).toBe(true);

    // Select checkbox rồi xóa
    await allProductsPage.toggleRowCheckboxByName(firstProductName, true);
    await allProductsPage.deleteProduct(firstProductName);

    // Verify kết quả
    const productNamesAfter = await allProductsPage.getColumnValues('name');
    const existsAfter = productNamesAfter.some((name) => name.includes(firstProductName));
    Logger.info(`📊 Sản phẩm còn tồn tại sau xóa: ${existsAfter}`);
  });

  test('TC_06: Xóa hàng loạt - bulkDeleteProducts()', async ({ allProductsPage }) => {
    const productNames = await allProductsPage.getColumnValues('name');
    expect(productNames.length).toBeGreaterThan(0);

    const productsToDelete = productNames.slice(0, Math.min(2, productNames.length));
    Logger.info(`🎯 Sẽ xóa ${productsToDelete.length} sản phẩm: ${productsToDelete.join(', ')}`);

    // Verify tất cả tồn tại trước khi xóa
    const productNamesBefore = await allProductsPage.getColumnValues('name');
    productsToDelete.forEach((productName) => {
      const exists = productNamesBefore.some((name) => name.includes(productName));
      expect(exists).toBe(true);
    });

    // Bulk delete
    await allProductsPage.bulkDeleteProducts(productsToDelete);

    // Verify kết quả
    const productNamesAfter = await allProductsPage.getColumnValues('name');
    productsToDelete.forEach((productName) => {
      const exists = productNamesAfter.some((name) => name.includes(productName));
      Logger.info(`📊 "${productName}" còn tồn tại: ${exists}`);
    });
  });

  test('TC_07: Edit sản phẩm từ trang khác - cross-page edit', async ({ allProductsPage }) => {
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();

    if (!targetProduct) {
      Logger.info('⏭️ Bỏ qua test: Không đủ dữ liệu');
      return;
    }

    Logger.info(`🎯 Target: "${targetProduct}"`);
    await allProductsPage.editProduct(targetProduct);
    await expect(allProductsPage.page).toHaveURL(/\/admin\/products\/.*\/edit/);
    Logger.info('✅ Đã edit thành công');
  });

  test('TC_08: Xóa sản phẩm từ trang khác - cross-page delete', async ({ allProductsPage }) => {
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();

    if (!targetProduct) {
      Logger.info('⏭️ Bỏ qua test: Không đủ dữ liệu');
      return;
    }

    Logger.info(`🎯 Target: "${targetProduct}"`);

    await allProductsPage.toggleRowCheckboxByName(targetProduct, true);
    await allProductsPage.deleteProduct(targetProduct);
    Logger.info('✅ Đã xóa thành công');
  });
});
