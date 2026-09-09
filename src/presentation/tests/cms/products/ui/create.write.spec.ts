/**
 * ============================================================================
 * TEST: CMS THÊM SẢN PHẨM MỚI
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Test form tạo sản phẩm mới tại /admin/products/create
 *
 * ════════════════════════════════════════════════════════════════════════════
 * 📐 PATTERNS & METHODS SỬ DỤNG TỪ PAGE OBJECTS
 * ════════════════════════════════════════════════════════════════════════════
 *
 * 1️⃣ FIXTURE INJECTION (thay vì new Page() thủ công)
 *    ┌─────────────────────────────────────────────────────────────────────┐
 *    │ test('...', async ({ addNewProductPage, dashboardPage }) => {      │
 *    │   // addNewProductPage đã tự động:                                 │
 *    │   //   - Login (authedPage fixture)                                │
 *    │   //   - Navigate đến /admin/products/create                      │
 *    │   //   - Verify trang đã load (expectOnPage)                      │
 *    │   // → Test KHÔNG cần setup gì thêm                               │
 *    │ });                                                                │
 *    └─────────────────────────────────────────────────────────────────────┘
 *
 * 2️⃣ SECTIONS.xxx.fill() — Bulk fill nhiều fields cùng lúc
 *    ┌─────────────────────────────────────────────────────────────────────┐
 *    │ // Điền nhiều fields trong 1 lần gọi                               │
 *    │ await addNewProductPage.sections.general.fill({                    │
 *    │   name: 'iPhone 15',                                               │
 *    │   category: null,  // null = chọn category đầu tiên               │
 *    │   unit: 'Pc',                                                      │
 *    │ });                                                                │
 *    │                                                                    │
 *    │ // Các section có sẵn:                                             │
 *    │ // .sections.general         → info, description, status, tax      │
 *    │ // .sections.priceAndStock   → pricing, variations, stock          │
 *    │ // .sections.filesAndMedia   → images, videos, pdf                 │
 *    │ // .sections.seo             → meta title, description, image      │
 *    │ // .sections.shipping        → COD, free shipping, flat rate       │
 *    └─────────────────────────────────────────────────────────────────────┘
 *
 * 3️⃣ FACADE METHODS — Shortcut gọi từng field (delegate xuống sections)
 *    ┌─────────────────────────────────────────────────────────────────────┐
 *    │ // Thay vì: addNewProductPage.sections.shipping.toggleCashOnDel... │
 *    │ await addNewProductPage.toggleCashOnDelivery(true);                │
 *    │ await addNewProductPage.toggleFeatured(true);                      │
 *    │ // Dùng khi chỉ cần thao tác 1-2 fields riêng lẻ                  │
 *    └─────────────────────────────────────────────────────────────────────┘
 *
 * 4️⃣ ELEMENT() — Truy cập locator để assert
 *    ┌─────────────────────────────────────────────────────────────────────┐
 *    │ // Lấy locator từ pageLocators đã khai báo trong Page Object       │
 *    │ await expect(addNewProductPage.element('productNameInput'))        │
 *    │   .toHaveValue('iPhone 15');                                       │
 *    │ await expect(addNewProductPage.element('featuredCheckbox'))        │
 *    │   .toBeChecked();                                                  │
 *    └─────────────────────────────────────────────────────────────────────┘
 *
 * 5️⃣ DATA SOURCES — 2 cách tạo test data
 *    ┌─────────────────────────────────────────────────────────────────────┐
 *    │ // Factory: random data mỗi lần chạy (Faker.js)                   │
 *    │ const data = createMinimalProductInfo();                           │
 *    │                                                                    │
 *    │ // Schema/Repository: data cố định từ JSON file                    │
 *    │ const data = getTestData('products', 'minimal');                   │
 *    └─────────────────────────────────────────────────────────────────────┘
 *
 * ════════════════════════════════════════════════════════════════════════════
 * ⚠️ LƯU Ý VỀ PARALLEL & SERIAL
 * ════════════════════════════════════════════════════════════════════════════
 *
 * CÓ THỂ CHẠY PARALLEL: Mỗi TC tạo product MỚI (tên unique từ Factory/Schema)
 * → Không conflict data giữa các workers.
 *
 * VỀ savePublish():
 * - KHÔNG assert successAlert (toast auto-dismiss sau ~3s, miss qua navigation)
 * - Assert bằng expect(page).toHaveURL() — URL redirect là state vĩnh viễn
 * - Chi tiết debugging: xem JSDoc của savePublish() trong CMSAddNewProductPage
 *
 * VỀ CMS DEMO SERVER:
 * - Server demo có thể chậm khi 6 workers đồng thời
 * - Nếu fail intermittent: tăng timeout trong savePublish() hoặc dùng serial
 * - Dùng serial: test.describe.configure({ mode: 'serial' })
 */
import { test } from '@fixtures/cms';
import { createMinimalProductInfo, createFullProductInfo, createProductWithDiscount } from '@data/cms/ProductDataFactory';
import { getTestData } from '@data/common/TestDataRepository';

test.describe('CMS Thêm sản phẩm mới', () => {

  test('TC_01: Điều hướng tới trang Thêm sản phẩm mới', async ({ dashboardPage, addNewProductPage }) => {
    await dashboardPage.navigateToSubMenu('Products', 'Add New Product');
    await addNewProductPage.expectOnPage();
  });

  test('TC_02: Điền thông tin sản phẩm cơ bản (Factory)', async ({ addNewProductPage }) => {
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

  });

  test('TC_03: Điền thông tin sản phẩm cơ bản (Schema)', async ({ addNewProductPage }) => {
    const productData = getTestData('products', 'minimal');

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

  });

  test('TC_04: Điền đầy đủ thông tin sản phẩm (Factory)', async ({ addNewProductPage }) => {
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

  });

  test('TC_05: Bật/tắt cài đặt sản phẩm', async ({ addNewProductPage }) => {
    await addNewProductPage.sections.general.fill({
      name: 'Settings Product ' + Date.now(),
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

  });

  test('TC_06: Cấu hình giảm giá và thuế (Factory)', async ({ addNewProductPage }) => {
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

  });
});
