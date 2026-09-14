/**
 * CMS Quản Lý Sản Phẩm — Mutating Tests (Edit, Delete) (@write @crud)
 * Lưu ý: Chạy serial mode để kiểm soát trạng thái dữ liệu khi chỉnh sửa và xóa sản phẩm.
 */
import { test, expect } from '@fixtures/cms';
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

  test('TC_05: Xóa một sản phẩm - deleteProduct()', async ({ allProductsPage, addNewProductPage }) => {
    const targetName = `Auto PW Del ${Date.now()}`;
    await addNewProductPage.goto();
    await addNewProductPage.fillBasicProductInfo({
      name: targetName,
      unit: 'Pc',
      minQty: 1,
      unitPrice: 150,
      quantity: 5,
    });
    await addNewProductPage.savePublish();
    Logger.info(`🎯 Đã tạo sản phẩm riêng để xóa: "${targetName}"`);

    // Verify sản phẩm tồn tại trước khi xóa
    await allProductsPage.expectProductExists(targetName);

    // Select checkbox rồi xóa
    await allProductsPage.toggleRowCheckboxByName(targetName, true);
    await allProductsPage.deleteProduct(targetName);

    // Verify kết quả sau xóa: KHÔNG còn tồn tại (R02: Hậu kiểm thực tế)
    await allProductsPage.expectProductNotExists(targetName);
    Logger.info(`✅ Xác nhận sản phẩm "${targetName}" đã biến mất sau khi xóa`);
  });

  test('TC_06: Xóa hàng loạt - bulkDeleteProducts()', async ({ allProductsPage, addNewProductPage }) => {
    const timestamp = Date.now();
    const product1 = `Auto Bulk A ${timestamp}`;
    const product2 = `Auto Bulk B ${timestamp}`;
    const productsToDelete = [product1, product2];

    for (const name of productsToDelete) {
      await addNewProductPage.goto();
      await addNewProductPage.fillBasicProductInfo({
        name,
        unit: 'Pc',
        minQty: 1,
        unitPrice: 200,
        quantity: 10,
      });
      await addNewProductPage.savePublish();
    }
    Logger.info(`🎯 Đã tạo 2 sản phẩm riêng: ${productsToDelete.join(', ')}`);

    // Verify tất cả tồn tại trước khi xóa
    for (const name of productsToDelete) {
      await allProductsPage.expectProductExists(name);
    }

    // Bulk delete
    await allProductsPage.bulkDeleteProducts(productsToDelete);

    // Verify kết quả: Cả 2 đều không còn tồn tại (R02: Hậu kiểm thực tế)
    for (const name of productsToDelete) {
      await allProductsPage.expectProductNotExists(name);
    }
    Logger.info('✅ Xác nhận toàn bộ sản phẩm bulk delete đã biến mất');
  });

  test('TC_07: Edit sản phẩm từ trang khác - cross-page edit', async ({ allProductsPage }) => {
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();
    test.skip(!targetProduct, 'Bỏ qua test: Không đủ dữ liệu ở trang tiếp theo');

    Logger.info(`🎯 Target: "${targetProduct}"`);
    await allProductsPage.editProduct(targetProduct!);
    await expect(allProductsPage.page).toHaveURL(/\/admin\/products\/.*\/edit/);
    Logger.info('✅ Đã edit thành công');
  });

  test('TC_08: Xóa sản phẩm từ trang khác - cross-page delete', async ({ allProductsPage }) => {
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();
    test.skip(!targetProduct, 'Bỏ qua test: Không đủ dữ liệu ở trang tiếp theo');

    Logger.info(`🎯 Target: "${targetProduct}"`);

    await allProductsPage.toggleRowCheckboxByName(targetProduct!, true);
    await allProductsPage.deleteProduct(targetProduct!);
    await allProductsPage.expectProductNotExists(targetProduct!);
    Logger.info('✅ Đã xóa thành công và xác nhận hậu kiểm');
  });
});
