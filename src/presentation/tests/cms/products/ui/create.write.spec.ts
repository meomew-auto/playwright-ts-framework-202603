/**
 * CMS Thêm sản phẩm mới (@write @crud)
 * Kiểm thử quy trình tạo sản phẩm từ form UI, kiểm chứng trong bảng sản phẩm và dọn dẹp data.
 */
import { test } from '@fixtures/cms';
import { createMinimalProductInfo, createFullProductInfo, createProductWithDiscount } from '@data/cms/ProductDataFactory';
import { getTestData } from '@data/common/TestDataRepository';

test.describe('CMS Thêm sản phẩm mới', () => {

  test('TC_01: Điều hướng tới trang Thêm sản phẩm mới', async ({ dashboardPage, addNewProductPage }) => {
    await dashboardPage.navigateToSubMenu('Products', 'Add New Product');
    await addNewProductPage.expectOnPage();
  });

  test('TC_02: Điền thông tin sản phẩm cơ bản (Factory)', async ({ addNewProductPage, allProductsPage }) => {
    const productData = createMinimalProductInfo();

    // Fill basic required fields
    await addNewProductPage.sections.general.fill({
      name: productData.name,
      category: null,
      brand: null,
      unit: productData.unit,
      minQty: productData.minQty,
    });
    await addNewProductPage.sections.priceAndStock.fill({
      unitPrice: productData.unitPrice,
      quantity: productData.quantity,
    });

    // Verify fields are filled
    await addNewProductPage.sections.general.verify({
      name: new RegExp(productData.name),
      unit: productData.unit,
      minQty: productData.minQty,
    });
    await addNewProductPage.sections.priceAndStock.verify({
      unitPrice: productData.unitPrice,
      quantity: productData.quantity,
    });

    // Upload thumbnail image
    await addNewProductPage.uploadThumbnailImage(0);

    // Save product
    await addNewProductPage.savePublish();

    // R08: Xác nhận sản phẩm thực sự xuất hiện trong danh sách
    await allProductsPage.expectProductExists(productData.name);

    // R01: Cleanup sản phẩm do test tạo
    await allProductsPage.deleteProduct(productData.name);
    await allProductsPage.expectProductNotExists(productData.name);
  });

  test('TC_03: Điền thông tin sản phẩm cơ bản (Schema)', async ({ addNewProductPage, allProductsPage }) => {
    // R08: Thêm timestamp để đảm bảo tên sản phẩm là unique
    const rawData = getTestData('products', 'minimal');
    const uniqueName = `${rawData.name} ${Date.now()}`;
    const productData = { ...rawData, name: uniqueName };

    // Fill basic required fields
    await addNewProductPage.sections.general.fill({
      name: productData.name,
      category: null,
      brand: null,
      unit: productData.unit,
      minQty: productData.minQty,
    });
    await addNewProductPage.sections.priceAndStock.fill({
      unitPrice: productData.unitPrice,
      quantity: productData.quantity,
    });

    // Verify fields are filled
    await addNewProductPage.sections.general.verify({
      name: new RegExp(productData.name),
      unit: productData.unit,
      minQty: productData.minQty,
    });
    await addNewProductPage.sections.priceAndStock.verify({
      unitPrice: productData.unitPrice,
      quantity: productData.quantity,
    });

    // Upload thumbnail image
    await addNewProductPage.uploadThumbnailImage(0);

    // Save product
    await addNewProductPage.savePublish();

    // R08: Xác nhận sản phẩm thực sự xuất hiện trong danh sách
    await allProductsPage.expectProductExists(productData.name);

    // R01: Cleanup sản phẩm do test tạo
    await allProductsPage.deleteProduct(productData.name);
    await allProductsPage.expectProductNotExists(productData.name);
  });

  test('TC_04: Điền đầy đủ thông tin sản phẩm (Factory)', async ({ addNewProductPage, allProductsPage }) => {
    const productData = createFullProductInfo();

    // Fill Product Information section
    await addNewProductPage.sections.general.fill({
      name: productData.name,
      category: 'Computer & Accessories',
      brand: null,
      unit: productData.unit,
      weight: productData.weight,
      minQty: productData.minQty,
      tags: productData.tags,
      barcode: productData.barcode,
    });

    // Fill Pricing section
    await addNewProductPage.sections.priceAndStock.fill({
      unitPrice: productData.unitPrice,
      discount: productData.discount,
      discountType: productData.discountType,
      quantity: productData.quantity,
      sku: productData.sku,
      externalLink: productData.externalLink,
      externalLinkBtn: productData.externalLinkBtn,
      stockVisibilityState: 'text',
    });

    // Fill Description section
    if (productData.description) {
      await addNewProductPage.sections.general.fillDescription(productData.description);
    }

    // Fill SEO section
    await addNewProductPage.sections.seo.fill({
      metaTitle: productData.metaTitle,
      metaDescription: productData.metaDescription,
    });

    // Fill Stock section
    await addNewProductPage.sections.priceAndStock.fill({
      lowStockQuantity: productData.lowStockQuantity,
      stockVisibilityState: productData.stockVisibilityState,
    });

    // Fill General section - Status, Tax
    await addNewProductPage.sections.general.fill({
      featured: productData.featured,
      todaysDeal: productData.todaysDeal,
      tax: productData.tax,
      taxType: productData.taxType,
    });

    // Fill Shipping section
    await addNewProductPage.sections.shipping.fill({
      cashOnDelivery: productData.cashOnDelivery,
      estShippingDays: productData.estShippingDays,
    });

    // Fill Files & Media section
    if (productData.videoProvider && productData.videoLink) {
      await addNewProductPage.sections.filesAndMedia.fill({
        videoProvider: productData.videoProvider,
        videoLink: productData.videoLink,
      });
    }

    // Upload images
    await addNewProductPage.sections.filesAndMedia.uploadThumbnailImage(0);
    await addNewProductPage.sections.filesAndMedia.uploadGalleryImages(0);
    await addNewProductPage.sections.filesAndMedia.uploadGalleryImages(1);

    // Verify some key fields
    await addNewProductPage.sections.general.verify({ name: productData.name });
    await addNewProductPage.sections.priceAndStock.verify({
      unitPrice: productData.unitPrice,
      quantity: productData.quantity,
    });

    // Save product
    await addNewProductPage.savePublish();

    // R08: Xác nhận sản phẩm thực sự xuất hiện trong danh sách
    await allProductsPage.expectProductExists(productData.name);

    // R01: Cleanup sản phẩm do test tạo
    await allProductsPage.deleteProduct(productData.name);
    await allProductsPage.expectProductNotExists(productData.name);
  });

  test('TC_05: Bật/tắt cài đặt sản phẩm', async ({ addNewProductPage, allProductsPage }) => {
    const productName = 'Settings Product ' + Date.now();
    await addNewProductPage.sections.general.fill({
      name: productName,
      category: null,
      brand: null,
      unit: 'Pc',
      minQty: 1,
    });
    await addNewProductPage.sections.priceAndStock.fill({
      unitPrice: 100.0,
      quantity: 10,
    });

    // Toggle various settings
    await addNewProductPage.toggleCashOnDelivery(true);
    await addNewProductPage.toggleFeatured(true);
    await addNewProductPage.toggleTodaysDeal(true);

    // Verify checkboxes are checked
    await addNewProductPage.sections.priceAndStock.verify({ cashOnDelivery: true });
    await addNewProductPage.sections.general.verify({ featured: true, todaysDeal: true });

    // Toggle off
    await addNewProductPage.toggleFeatured(false);
    await addNewProductPage.sections.general.verify({ featured: false });

    // Upload thumbnail image
    await addNewProductPage.sections.filesAndMedia.uploadThumbnailImage(0);

    // Save product
    await addNewProductPage.savePublish();

    // R08: Xác nhận sản phẩm thực sự xuất hiện trong danh sách
    await allProductsPage.expectProductExists(productName);

    // R01: Cleanup sản phẩm do test tạo
    await allProductsPage.deleteProduct(productName);
    await allProductsPage.expectProductNotExists(productName);
  });

  test('TC_06: Cấu hình giảm giá và thuế (Factory)', async ({ addNewProductPage, allProductsPage }) => {
    const productData = createProductWithDiscount({
      tax: 10,
      taxType: 'Percent',
    });

    // Fill basic info
    await addNewProductPage.sections.general.fill({
      name: productData.name,
      category: null,
      brand: null,
      unit: productData.unit,
      minQty: productData.minQty,
    });
    await addNewProductPage.sections.priceAndStock.fill({
      unitPrice: productData.unitPrice,
      quantity: productData.quantity,
    });

    // Configure discount
    await addNewProductPage.sections.priceAndStock.fill({
      discount: productData.discount,
      discountType: productData.discountType,
    });

    // Configure tax
    await addNewProductPage.sections.general.fill({
      tax: productData.tax,
      taxType: productData.taxType,
    });

    // Verify discount and tax
    await addNewProductPage.sections.priceAndStock.verify({
      discount: productData.discount,
    });
    await addNewProductPage.sections.general.verify({
      tax: productData.tax,
    });

    // Upload thumbnail image
    await addNewProductPage.sections.filesAndMedia.uploadThumbnailImage(0);

    // Save product
    await addNewProductPage.savePublish();

    // R08: Xác nhận sản phẩm thực sự xuất hiện trong danh sách
    await allProductsPage.expectProductExists(productData.name);

    // R01: Cleanup sản phẩm do test tạo
    await allProductsPage.deleteProduct(productData.name);
    await allProductsPage.expectProductNotExists(productData.name);
  });
});
