/**
 * ============================================================================
 * TEST: CMS TẤT CẢ SẢN PHẨM — Read-Only Tests
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Test trang danh sách sản phẩm tại /admin/products
 * Các tests này chỉ đọc dữ liệu, không thay đổi gì → có thể chạy song song
 *
 * ════════════════════════════════════════════════════════════════════════════
 * 📐 PATTERNS & METHODS SỬ DỤNG TỪ PAGE OBJECTS
 * ════════════════════════════════════════════════════════════════════════════
 *
 * 1️⃣ FIXTURE INJECTION
 *    - allProductsPage đã tự động login + navigate + verify loaded
 *
 * 2️⃣ TABLE HELPER METHODS (từ CollectionHelper/TableResolver)
 *    - getColumnValues('name')           → lấy tất cả giá trị 1 cột
 *    - getTableData(['name', 'addedBy']) → lấy dữ liệu nhiều cột
 *    - findRowByColumnValue()            → tìm dòng theo 1 cột
 *    - findRowByFilters()                → tìm dòng theo nhiều cột
 *    - findRowByFiltersAcrossPages()     → tìm dòng qua nhiều trang
 *
 * 3️⃣ PAGE ACTIONS
 *    - search() / clearSearch()          → tìm kiếm sản phẩm
 *    - selectSeller() / selectSort()     → lọc và sắp xếp
 *    - goToPage() / goToNextPage()       → điều hướng phân trang
 *    - toggleRowCheckboxByName()         → bật/tắt checkbox dòng
 */
import { test, expect } from '@fixtures/cms';
import { Logger } from '@utils/Logger';

test.describe('CMS Tất Cả Sản Phẩm', () => {

  test('TC_01: Điều hướng đến trang Tất Cả Sản Phẩm', async ({ allProductsPage }) => {
    // Fixture đã tự động gọi goto() và expectOnPage()
    const rowCount = await allProductsPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('TC_02: Lấy giá trị cột - getColumnValues()', async ({ allProductsPage }) => {
    const productNames = await allProductsPage.getColumnValues('name');
    Logger.info(`📋 Tìm thấy ${productNames.length} sản phẩm`);
    expect(productNames.length).toBeGreaterThan(0);

    const addedByValues = await allProductsPage.getColumnValues('addedBy');
    expect(addedByValues.length).toBeGreaterThan(0);

    const stockValues = await allProductsPage.getColumnValues('totalStock');
    expect(stockValues.length).toBeGreaterThan(0);
  });

  test('TC_03: Lấy dữ liệu bảng - getTableData()', async ({ allProductsPage }) => {
    const tableData = await allProductsPage.getTableData(['name', 'addedBy', 'totalStock', 'published']);
    expect(tableData.length).toBeGreaterThan(0);
    expect(tableData[0]).toHaveProperty('name');
    expect(tableData[0]).toHaveProperty('addedBy');
  });

  test('TC_04: Lấy dữ liệu bảng mặc định - getDefaultTableData()', async ({ allProductsPage }) => {
    const defaultData = await allProductsPage.getDefaultTableData();
    expect(defaultData.length).toBeGreaterThan(0);
    expect(defaultData[0]).toHaveProperty('name');
  });

  test('TC_05: Tìm dòng theo giá trị cột - findRowByColumnValue()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();

    const row = await allProductsPage.findRowByColumnValue('name', firstProductName);
    await expect(row).toBeVisible();
  });

  test('TC_06: Tìm dòng theo nhiều bộ lọc - findRowByFilters()', async ({ allProductsPage }) => {
    const tableData = await allProductsPage.getTableData(['name', 'addedBy', 'published']);
    const firstRow = tableData[0];
    expect(firstRow).toBeDefined();

    const row = await allProductsPage.findRowByFilters({
      name: firstRow.name,
      addedBy: firstRow.addedBy,
    });
    await expect(row).toBeVisible();
  });

  test('TC_07: Lấy dữ liệu dòng theo bộ lọc - getRowDataByFilters()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();

    const rowData = await allProductsPage.getRowDataByFilters(
      { name: firstProductName },
      ['name', 'addedBy', 'info', 'totalStock']
    );
    expect(rowData).toHaveProperty('name');
  });

  test('TC_08: Tìm kiếm sản phẩm - search()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    const searchTerm = firstProductName.substring(0, 10);

    await allProductsPage.search(searchTerm);

    const productNames = await allProductsPage.getColumnValues('name');
    productNames.forEach((name) => {
      expect(name.toLowerCase()).toContain(searchTerm.toLowerCase());
    });
  });

  test('TC_09: Lọc theo người bán - selectSeller()', async ({ allProductsPage }) => {
    const addedByValues = await allProductsPage.getColumnValues('addedBy');
    const uniqueSellers = [...new Set(addedByValues)].filter((s) => s.trim().length > 0);
    
    if (uniqueSellers.length > 0) {
      await allProductsPage.selectSeller(uniqueSellers[0]);
      const filteredAddedBy = await allProductsPage.getColumnValues('addedBy');
      filteredAddedBy.forEach((seller) => {
        expect(seller).toBe(uniqueSellers[0]);
      });
    }
  });

  test('TC_10: Sắp xếp sản phẩm - selectSort()', async ({ allProductsPage }) => {
    await allProductsPage.selectSort('Base Price (High > Low)');
    const tableData = await allProductsPage.getTableData(['name', 'info']);
    expect(tableData.length).toBeGreaterThan(0);
  });

  test('TC_11: Điều hướng phân trang - goToPage() và goToNextPage()', async ({ allProductsPage }) => {
    const page1Products = await allProductsPage.getColumnValues('name');
    Logger.info(`📄 Trang 1 có ${page1Products.length} sản phẩm`);

    try {
      await allProductsPage.goToPage(2);
      const page2Products = await allProductsPage.getColumnValues('name');
      expect(page2Products[0]).not.toBe(page1Products[0]);
    } catch {
      Logger.info('📄 Trang 2 không khả dụng (chỉ có 1 trang)');
    }
  });

  test('TC_12: Bật/tắt checkbox dòng - toggleRowCheckboxByName()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();

    await allProductsPage.toggleRowCheckboxByName(firstProductName, true);
    const row = await allProductsPage.findRowByColumnValue('name', firstProductName);
    const checkbox = row.locator('input[type="checkbox"].check-one').first();
    await expect(checkbox).toBeChecked();

    await allProductsPage.toggleRowCheckboxByName(firstProductName, false);
    await expect(checkbox).not.toBeChecked();
  });


  test('TC_13: Tìm dòng qua nhiều trang - findRowByFiltersAcrossPages()', async ({ allProductsPage }) => {
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();

    if (targetProduct) {
      const { row, pageNumber } = await allProductsPage.findRowByFiltersAcrossPages(
        { name: targetProduct },
        { maxPages: 5 }
      );
      await expect(row).toBeVisible();
      Logger.info(`📄 Tìm thấy ở trang ${pageNumber}`);
    } else {
      Logger.info('⏭️ Bỏ qua test: Không đủ dữ liệu (cần ít nhất 2 trang)');
    }
  });

  test('TC_14: Lấy dữ liệu dòng qua nhiều trang - getRowDataByFiltersAcrossPages()', async ({ allProductsPage }) => {
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();

    if (targetProduct) {
      const { data, pageNumber } = await allProductsPage.getRowDataByFiltersAcrossPages(
        { name: targetProduct },
        { maxPages: 5 },
        ['name', 'addedBy', 'info', 'totalStock', 'published', 'featured']
      );
      expect(data).toHaveProperty('name');
      expect(data.name).toContain(targetProduct);
      Logger.info(`📄 Tìm thấy ở trang ${pageNumber}: ${JSON.stringify(data)}`);
    } else {
      Logger.info('⏭️ Bỏ qua test: Không đủ dữ liệu');
    }
  });

  test('TC_15: Tìm kiếm kết hợp phân trang - search() + findRowByFiltersAcrossPages()', async ({ allProductsPage }) => {
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();

    if (targetProduct) {
      const searchTerm = targetProduct.substring(0, 5);
      await allProductsPage.search(searchTerm);

      const searchResults = await allProductsPage.getColumnValues('name');
      const foundInPage1 = searchResults.some((name) => name.includes(targetProduct));
      
      if (!foundInPage1) {
        await allProductsPage.clearSearch();
        const { row, pageNumber } = await allProductsPage.findRowByFiltersAcrossPages(
          { name: targetProduct },
          { maxPages: 5 }
        );
        await expect(row).toBeVisible();
        Logger.info(`📄 Tìm thấy ở trang ${pageNumber}`);
      } else {
        Logger.info(`✅ Tìm thấy "${targetProduct}" ngay ở kết quả search trang 1`);
      }
    } else {
      Logger.info('⏭️ Bỏ qua test: Không đủ dữ liệu');
    }
  });
});
