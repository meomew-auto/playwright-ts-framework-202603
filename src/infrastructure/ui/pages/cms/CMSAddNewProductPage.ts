/**
 * ============================================================================
 * CMS ADD NEW PRODUCT PAGE — POM cho form tạo sản phẩm mới
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Automate form tạo product phức tạp với nhiều sections:
 * Product Info, Images, Video, Price, Stock, SEO, Settings, Shipping.
 * URL: /admin/products/create
 *
 * ════════════════════════════════════════════════════════════════════════════
 * 📐 PATTERN: SECTION DELEGATION
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Form "Add New Product" có ~50+ fields chia thành 7 tabs.
 * Nếu viết tất cả methods phẳng trong 1 class → file sẽ chaos, khó maintain.
 *
 * GIẢI PHÁP: Chia thành 3 tầng:
 *
 * ```
 * CMSAddNewProductPage
 * ├── 1️⃣ Locators (pageLocators)         ← Định nghĩa tất cả selectors
 * ├── 2️⃣ Sections (createSections())     ← Logic chia theo tab/nhóm
 * │   ├── general      (info + description + status + flashDeal + tax)
 * │   ├── filesAndMedia (images + videos + pdf)
 * │   ├── priceAndStock (pricing + variations + stock)
 * │   ├── seo
 * │   ├── shipping
 * │   ├── warranty
 * │   └── frequentlyBought
 * └── 3️⃣ Facade methods                  ← Shortcut 1-liner delegate xuống sections
 * ```
 *
 * TẠI SAO DÙNG PATTERN NÀY?
 * ┌──────────────────┬──────────────────────────────────────────────────┐
 * │ Tab auto-switch  │ Mỗi section tự gọi ensureTab() — test không    │
 * │                  │ cần biết field nằm ở tab nào                    │
 * ├──────────────────┼──────────────────────────────────────────────────┤
 * │ Bulk fill        │ sections.general.fill({ name, category, unit }) │
 * │                  │ — điền nhiều field 1 lần                        │
 * ├──────────────────┼──────────────────────────────────────────────────┤
 * │ Granular         │ sections.priceAndStock.fillUnitPrice(100)       │
 * │                  │ — điền từng field khi cần                       │
 * ├──────────────────┼──────────────────────────────────────────────────┤
 * │ Tổ chức rõ       │ Code chia theo UI tabs, dễ tìm                 │
 * ├──────────────────┼──────────────────────────────────────────────────┤
 * │ 2 cách gọi       │ addNewProductPage.fillUnitPrice()               │
 * │                  │ hoặc addNewProductPage.sections.priceAndStock    │
 * │                  │ .fillUnitPrice()                                │
 * └──────────────────┴──────────────────────────────────────────────────┘
 *
 * VÍ DỤ SỬ DỤNG TRONG TEST:
 * ```typescript
 * // Cách 1: Bulk fill theo section (khuyên dùng)
 * await addNewProductPage.sections.general.fill({
 *   name: 'Product A', category: null, unit: 'Pc', minQty: 1,
 * });
 * await addNewProductPage.sections.priceAndStock.fill({
 *   unitPrice: 100, quantity: 10,
 * });
 *
 * // Cách 2: Facade shortcut (nếu chỉ cần 1 field)
 * await addNewProductPage.fillUnitPrice(100);
 * ```
 *
 * 🔗 LIÊN KẾT:
 * - Dùng: ProductInfo model (models/cms/Product.ts)
 * - Fixture: cms/ui/app.fixture.ts (addNewProductPage)
 * - Extends: BasePage (createLocatorGetter)
 */
import { BasePage } from '../base/BasePage';
import { Page, Locator, expect } from '@playwright/test';
import { ViewportType } from '@fixtures/common/ViewportType';
import { BootstrapSelectHelper } from '@helpers/cms/BootstrapSelectHelper';
import {
  ProductSectionContext,
  GeneralProductSection,
  FilesAndMediaProductSection,
  PriceAndStockProductSection,
  SeoProductSection,
  ShippingProductSection,
  WarrantyProductSection,
  FrequentlyBoughtProductSection,
  TabKey,
} from './sections';

export class CMSAddNewProductPage extends BasePage {
  protected readonly helpers: BootstrapSelectHelper;
  private readonly pageLocators = (() => {
    // Helper functions để tái sử dụng trong các locators khác
    const getFormGroup = (page: Page, labelText: string) =>
      page.locator('.form-group.row').filter({ 
        has: page.locator('label.col-from-label, label.col-form-label').filter({ hasText: labelText }) 
      });

    const getUploadModalParent = (page: Page) =>
      page.locator('.modal-content').filter({ has: page.locator('a[href="#aiz-select-file"]') });

    const getAizSwitchLabel = (page: Page, inputName: string) =>
      page.locator('label.aiz-switch').filter({ has: page.locator(`input[name="${inputName}"]`) });

    const getRadioLabel = (page: Page, inputName: string, value: string) =>
      page.locator('label').filter({ has: page.locator(`input[name="${inputName}"][value="${value}"]`) });

    return {
    // ========== Simple Selectors (String) ==========
    form: '#choice_form',
    productNameInput: 'input[name="name"]',
    unitInput: 'input[name="unit"]',
    weightInput: 'input[name="weight"]',
    minQtyInput: 'input[name="min_qty"]',
    tagsInput: 'input[name="tags[]"]',
    barcodeInput: 'input[name="barcode"]',
    unitPriceInput: 'input[name="unit_price"]',
    discountDateRangeInput: 'input[name="date_range"]',
    discountInput: 'input[name="discount"]',
    quantityInput: 'input[name="current_stock"]',
    skuInput: 'input[name="sku"]',
    externalLinkInput: 'input[name="external_link"]',
    externalLinkBtnInput: 'input[name="external_link_btn"]',
    descriptionTextarea: 'textarea[name="description"]',
    metaTitleInput: 'input[name="meta_title"]',
    metaDescriptionTextarea: 'textarea[name="meta_description"]',
    lowStockQuantityInput: 'input[name="low_stock_quantity"]',
    stockVisibilityQuantityRadio: 'input[name="stock_visibility_state"][value="quantity"]',
    stockVisibilityTextRadio: 'input[name="stock_visibility_state"][value="text"]',
    stockVisibilityHideRadio: 'input[name="stock_visibility_state"][value="hide"]',
    cashOnDeliveryCheckbox: 'input[name="cash_on_delivery"]',
    featuredCheckbox: 'input[name="featured"]',
    todaysDealCheckbox: 'input[name="todays_deal"]',
    flashDiscountInput: 'input[name="flash_discount"]',
    estShippingDaysInput: 'input[name="est_shipping_days"]',
    taxInput: 'input[name="tax[]"]',
    videoLinkInput: 'input[name="video_link"]',
    colorsActiveCheckbox: 'input[name="colors_active"]',
    freeShippingRadio: 'input[name="shipping_type"][value="free"]',
    flatRateRadio: 'input[name="shipping_type"][value="flat_rate"]',
    flatShippingCostInput: 'input[name="flat_shipping_cost"]',
    isQuantityMultipliedCheckbox: 'input[name="is_quantity_multiplied"]',
    saveUnpublishButton: 'button[name="button"][value="unpublish"]',
    savePublishButton: 'button[name="button"][value="publish"]',
    successAlert: '.alert-success, .aiz-alert-success, [role="alert"].alert-success',

    // ========== Page Elements ==========
    pageTitle: (page: Page) =>
      page
        .locator('.aiz-titlebar h1, .aiz-titlebar h2, .aiz-titlebar h3, .aiz-titlebar h4, .aiz-titlebar h5, .aiz-titlebar h6')
        .filter({ hasText: 'Add New Product' }),
    // Tab headers
    tabGeneral: '#general-tab',
    tabFilesMedia: '#files-and-media-tab',
    tabPriceStock: '#price-and-stocks-tab',
    tabSEO: '#seo-tab',
    tabShipping: '#shipping-tab',
    tabWarranty: '#warranty-tab',
    tabFrequentlyBought: '#frequenty-bought-product-tab',
    
    // ========== Reusable Dynamic Locators ==========
    // formGroup: Tái sử dụng container cho bất kỳ field nào theo label
    // Usage: this.element('formGroup')('Tags') → Locator
    formGroup: (page: Page, labelText: string) =>
      page.locator('.form-group.row').filter({ 
        has: page.locator('label.col-from-label, label.col-form-label').filter({ hasText: labelText }) 
      }),

    // uploadModalParent: Tái sử dụng upload modal parent locator
    // Usage: this.element('uploadModalParent')() → Locator
    uploadModalParent: (page: Page) =>
      page.locator('.modal-content').filter({ has: page.locator('a[href="#aiz-select-file"]') }),



    // aizSwitchLabel: Tái sử dụng label cho aiz-switch checkbox
    // Usage: this.element('aizSwitchLabel')('cash_on_delivery') → Locator
    aizSwitchLabel: (page: Page, inputName: string) =>
      page.locator('label.aiz-switch').filter({ has: page.locator(`input[name="${inputName}"]`) }),

    // radioLabel: Tái sử dụng label cho radio button
    // Usage: this.element('radioLabel')('stock_visibility_state', 'quantity') → Locator
    radioLabel: (page: Page, inputName: string, value: string) =>
      page.locator('label').filter({ has: page.locator(`input[name="${inputName}"][value="${value}"]`) }),

    // bootstrapSelectOption: Tái sử dụng dropdown option selector
    // Usage: this.element('bootstrapSelectOption')('bs-select-1', 'Category Name') → Locator
    bootstrapSelectOption: (page: Page, dropdownId: string, optionText: string) =>
      page.locator(`#${dropdownId} .dropdown-item`).filter({ hasText: optionText }).first(),

    // ========== Pre-configured Locators (Tái sử dụng reusable locators) ==========
    // Product Information Section
    tagsTagify: (page: Page) => getFormGroup(page, 'Tags').locator('tags.tagify'),
    tagsTagifyInput: (page: Page) => getFormGroup(page, 'Tags').locator('tags.tagify .tagify__input'),
    categorySelect: (page: Page) => getFormGroup(page, 'Category').locator('button[data-id="category_id"]'),
    brandSelect: (page: Page) => getFormGroup(page, 'Brand').locator('button[data-id="brand_id"]'),
    categorySelectOption: (page: Page, categoryText: string) =>
      page.locator(`#bs-select-1 .dropdown-item`).filter({ hasText: categoryText }).first(),
    brandSelectOption: (page: Page, brandText: string) =>
      page.locator(`#bs-select-2 .dropdown-item`).filter({ hasText: brandText }).first(),
    
    // ========== Product Images Section (Tái sử dụng formGroup) ==========
    galleryImagesUpload: (page: Page) => page.locator('div[data-toggle="aizuploader"][data-type="image"][data-multiple="true"]'),
    galleryImagesBrowse: (page: Page) => getFormGroup(page, 'Gallery Images').locator('div[data-toggle="aizuploader"] .input-group-text'),
    thumbnailImageUpload: (page: Page) => page.locator('div[data-toggle="aizuploader"][data-type="image"]:not([data-multiple])'),
    thumbnailImageBrowse: (page: Page) => getFormGroup(page, 'Thumbnail Image').locator('div[data-toggle="aizuploader"] .input-group-text'),
    
    // ========== Upload Modal Section (Tái sử dụng uploadModalParent) ==========
    uploadModal: (page: Page) => getUploadModalParent(page),
    uploadModalSelectFileTab: (page: Page) => getUploadModalParent(page).locator('a[href="#aiz-select-file"]'),
    uploadModalUploadNewTab: (page: Page) => getUploadModalParent(page).locator('a[href="#aiz-upload-new"]'),
    uploadModalFileCard: (page: Page) => getUploadModalParent(page).locator('.aiz-uploader-select.card-file'),
    uploadModalFileCardByIndex: (page: Page) => (index: number) => 
      getUploadModalParent(page).locator('.aiz-uploader-select.card-file').nth(index),
    uploadModalAddFilesButton: (page: Page) => getUploadModalParent(page).locator('button[data-toggle="aizUploaderAddSelected"]'),
    uploadModalCloseButton: (page: Page) => getUploadModalParent(page).locator('button.close, button[data-dismiss="modal"]'),
    uploadModalUploadInput: (page: Page) => getUploadModalParent(page).locator('.uppy-Dashboard-input[type="file"]'),
    
    // Product Videos Section
    videoProviderSelect: (page: Page) => page.locator('button[data-id="video_provider"]'),
    videoProviderOption: (page: Page, provider: 'Youtube' | 'Dailymotion' | 'Vimeo') => 
      page.locator(`#bs-select-3 .dropdown-item`).filter({ hasText: provider }).first(),
    
    // Product Variation Section
    colorsSelect: (page: Page) => page.locator('button[data-id="colors"]'),
    colorsActiveLabel: (page: Page) => {
      return page.locator('label.aiz-switch').filter({ has: page.locator('input[name="colors_active"]') });
    },
    attributesSelect: (page: Page) => page.locator('button[data-id="choice_attributes"]'),
    attributesSelectOption: (page: Page, attributeText: string) => 
      page.locator(`#bs-select-5 .dropdown-item`).filter({ hasText: attributeText }).first(),
    
    // Product price + stock Section
    discountTypeSelect: (page: Page) => page.locator('select[name="discount_type"]').locator('..').locator('button.dropdown-toggle'),
    discountTypeOption: (page: Page, type: 'Flat' | 'Percent') => 
      page.locator(`#bs-select-6 .dropdown-item`).filter({ hasText: type }).first(),
    
    // Product Description Section
    descriptionEditor: (page: Page) => page.locator('.note-editable'),
    
    // PDF Specification Section
    pdfUpload: (page: Page) => page.locator('div[data-toggle="aizuploader"][data-type="document"]'),
    pdfBrowse: (page: Page) => page.locator('div[data-toggle="aizuploader"][data-type="document"] .input-group-text'),
    
    // SEO Meta Tags Section
    metaImageUpload: (page: Page) => page.locator('div[data-toggle="aizuploader"][data-type="image"]').nth(2),
    metaImageBrowse: (page: Page) => page.locator('div[data-toggle="aizuploader"][data-type="image"]').nth(2).locator('.input-group-text'),
    
    // Right Sidebar - Shipping Configuration (Tái sử dụng reusable locators)
    stockVisibilityQuantityLabel: (page: Page) => getRadioLabel(page, 'stock_visibility_state', 'quantity'),
    stockVisibilityTextLabel: (page: Page) => getRadioLabel(page, 'stock_visibility_state', 'text'),
    stockVisibilityHideLabel: (page: Page) => getRadioLabel(page, 'stock_visibility_state', 'hide'),
    cashOnDeliveryLabel: (page: Page) => getAizSwitchLabel(page, 'cash_on_delivery'),
    freeShippingLabel: (page: Page) => page.locator('label.aiz-switch').filter({ has: page.locator('input[name="shipping_type"][value="free"]') }),
    flatRateLabel: (page: Page) => page.locator('label.aiz-switch').filter({ has: page.locator('input[name="shipping_type"][value="flat_rate"]') }),
    isQuantityMultipliedLabel: (page: Page) => getAizSwitchLabel(page, 'is_quantity_multiplied'),
    featuredLabel: (page: Page) => getAizSwitchLabel(page, 'featured'),
    todaysDealLabel: (page: Page) => getAizSwitchLabel(page, 'todays_deal'),
    flashDealSelect: (page: Page) => page.locator('button[data-id="flash_deal"]'),
    flashDealOption: (page: Page, dealText: string) => 
      page.locator(`#bs-select-7 .dropdown-item`).filter({ hasText: dealText }).first(),
    flashDiscountTypeSelect: (page: Page) => page.locator('button[data-id="flash_discount_type"]'),
    flashDiscountTypeOption: (page: Page, type: 'Flat' | 'Percent') => 
      page.locator(`#bs-select-8 .dropdown-item`).filter({ hasText: type }).first(),
    taxTypeSelect: (page: Page) => page.locator('select[name="tax_type[]"]').locator('..').locator('button.dropdown-toggle'),
    taxTypeOption: (page: Page, type: 'Flat' | 'Percent') => 
      page.locator(`#bs-select-4 .dropdown-item`).filter({ hasText: type }).first(),
    } as const;
  })();

  public element = this.createLocatorGetter(this.pageLocators);
  public readonly sections: {
    general: GeneralProductSection;
    filesAndMedia: FilesAndMediaProductSection;
    priceAndStock: PriceAndStockProductSection;
    seo: SeoProductSection;
    shipping: ShippingProductSection;
    warranty: WarrantyProductSection;
    frequentlyBought: FrequentlyBoughtProductSection;
  };

  constructor(page: Page, viewportType: ViewportType = 'desktop') {
    super(page, viewportType);
    this.helpers = new BootstrapSelectHelper(page);

    const ensureTab = async (tab: TabKey) => {
      const tabMap = {
        general: this.element('tabGeneral'),
        files_and_media: this.element('tabFilesMedia'),
        price_and_stocks: this.element('tabPriceStock'),
        seo: this.element('tabSEO'),
        shipping: this.element('tabShipping'),
        warranty: this.element('tabWarranty'),
        frequenty_bought_product: this.element('tabFrequentlyBought'),
      } as const;

      const tabLocator = tabMap[tab];
      const selected = await tabLocator.getAttribute('aria-selected');
      if (selected !== 'true') {
        await this.clickWithLog(tabLocator);
      }
    };

    const ctx: ProductSectionContext = {
      page: this.page,
      element: (key: string, ...args: any[]) => (this.element as any)(key, ...args),
      helpers: this.helpers,
      ensureTab,
      clickWithLog: (loc, opt) => this.clickWithLog(loc, opt),
      fillWithLog: (loc, val, opt) => this.fillWithLog(loc, val, opt),
      verifyFieldValues: (fields) => this.verifyFieldValues(fields),
      selectImageFromModal: (btn, idx) => this.selectImageFromModal(btn, idx),
      uploadNewImageFromModal: (btn, path) => this.uploadNewImageFromModal(btn, path),
    };

    this.sections = {
      general: new GeneralProductSection(ctx),
      filesAndMedia: new FilesAndMediaProductSection(ctx),
      priceAndStock: new PriceAndStockProductSection(ctx),
      seo: new SeoProductSection(ctx),
      shipping: new ShippingProductSection(ctx),
      warranty: new WarrantyProductSection(ctx),
      frequentlyBought: new FrequentlyBoughtProductSection(ctx),
    };
  }

  /**
   * Navigate đến trang Add New Product
   */
  async goto() {
    await this.navigateTo('/admin/products/create');
  }

  /**
   * Verify trang Add New Product đã load đúng
   */
  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/products\/create/);
    await expect(this.element('pageTitle')).toBeVisible();
    await expect(this.element('form')).toBeVisible();
    await expect(this.element('productNameInput')).toBeVisible();
  }

  // ========== Helper methods (shared across sections) ==========
  /**
   * Mở modal upload và chọn file từ danh sách có sẵn
   * @param browseButtonLocator - Locator của browse button (galleryImagesBrowse hoặc thumbnailImageBrowse)
   * @param fileIndex - Index của file cần chọn (0 = file đầu tiên)
   */
  private async selectImageFromModal(browseButtonLocator: Locator, fileIndex: number = 0) {
    await browseButtonLocator.scrollIntoViewIfNeeded();
    await expect(browseButtonLocator).toBeVisible();
    await this.clickWithLog(browseButtonLocator);
    
    const modal = this.element('uploadModal');
    await expect(modal).toBeVisible();
    
    const selectFileTab = this.element('uploadModalSelectFileTab');
    // Kiểm tra class 'active' bằng cách đọc attribute class
    const classAttr = await selectFileTab.getAttribute('class');
    const isActive = classAttr?.includes('active') ?? false;
    if (!isActive) {
      await this.clickWithLog(selectFileTab);
    }
    
    const fileCardGetter = this.element('uploadModalFileCardByIndex');
    const fileCard = fileCardGetter(fileIndex);
    await expect(fileCard).toBeVisible();
    await fileCard.scrollIntoViewIfNeeded();
    await this.clickWithLog(fileCard);
    
    const addFilesButton = this.element('uploadModalAddFilesButton');
    await expect(addFilesButton).toBeVisible();
    await this.clickWithLog(addFilesButton);
    
    await expect(modal).toBeHidden({ timeout: 10000 });
  }

  /**
   * Upload file mới từ modal (tab Upload New)
   * @param browseButtonLocator - Locator của browse button
   * @param filePath - Đường dẫn file cần upload
   */
  private async uploadNewImageFromModal(browseButtonLocator: Locator, filePath: string) {
    await browseButtonLocator.scrollIntoViewIfNeeded();
    await expect(browseButtonLocator).toBeVisible();
    await this.clickWithLog(browseButtonLocator);
    
    const modal = this.element('uploadModal');
    await expect(modal).toBeVisible();
    
    const uploadNewTab = this.element('uploadModalUploadNewTab');
    await expect(uploadNewTab).toBeVisible();
    await this.clickWithLog(uploadNewTab);
    
    const uploadInput = this.element('uploadModalUploadInput');
    await expect(uploadInput).toBeVisible();
    await uploadInput.setInputFiles(filePath);
    
    const addFilesButton = this.element('uploadModalAddFilesButton');
    await expect(addFilesButton).toBeVisible();
    await this.clickWithLog(addFilesButton);
    
    await expect(modal).toBeHidden({ timeout: 10000 });
  }

  /**
   * Submit form với Save & Unpublish
   */
  async saveUnpublish() {
    await this.clickWithLog(this.element('saveUnpublishButton'));
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Submit form với Save & Publish.
   *
   * ═══════════════════════════════════════════════════════════════
   * 🐛 DEBUGGING HISTORY — Tại sao dùng toHaveURL thay vì alert?
   * ═══════════════════════════════════════════════════════════════
   *
   * CMS flow: Click Save → POST → 302 Redirect → GET /admin/products
   * Trang redirect có flash alert: "Product has been inserted successfully"
   * Alert này AUTO-DISMISS sau ~3 giây rồi biến mất.
   *
   * ❌ Approach 1: waitForLoadState('networkidle') + toBeVisible()
   *    → networkidle đợi TẤT CẢ resources (images, fonts, scripts)
   *    → Mất 3-5s → alert đã dismiss → fail
   *
   * ❌ Approach 2: Promise.all([waitFor('visible'), click])
   *    → waitFor bắt đầu trên OLD page → page navigate → frame detached
   *    → waitFor không recover kịp trước khi alert dismiss
   *
   * ❌ Approach 3: waitForURL(domcontentloaded) + waitFor('visible')
   *    → Vẫn race condition: domcontentloaded resolve nhưng alert đã dismiss
   *
   * ❌ Approach 4: expect(successAlert).toBeVisible({ timeout: 15000 })
   *    → Web-first assertion tự retry nhưng qua page navigation,
   *      polling bị gián đoạn (frame detach) → miss cửa sổ 3s
   *
   * ✅ SOLUTION: expect(page).toHaveURL() — Assert URL redirect
   *    → URL là state VĨNH VIỄN (không auto-dismiss như alert)
   *    → Regex: /\/admin\/products(?!\/create)/ = products page, KHÔNG phải create
   *    → Chứng minh save thành công: chỉ khi POST 302 mới redirect khỏi /create
   *    → Hoạt động ổn định cả parallel (6 workers) lẫn serial
   */
  async savePublish() {
    await this.clickWithLog(this.element('savePublishButton'));
    await expect(this.page).toHaveURL(/\/admin\/products(?!\/create)/, { timeout: 15000 });
  }

  /**
   * Điền thông tin sản phẩm cơ bản (required fields)
   */
  async fillBasicProductInfo(data: {
    name: string;
    category?: string; // Optional - nếu không có sẽ chọn category đầu tiên
    unit: string;
    minQty: number;
    unitPrice: number;
    quantity: number;
  }) {
    await this.sections.general.fillProductName(data.name);
    
    // Nếu có category thì chọn, không thì chọn category đầu tiên
    if (data.category) {
      await this.sections.general.selectCategory(data.category);
    } else {
      await this.sections.general.selectFirstCategory();
    }
    
    await this.sections.general.fillUnit(data.unit);
    await this.sections.general.fillMinQty(data.minQty);
    await this.sections.priceAndStock.fillUnitPrice(data.unitPrice);
    await this.sections.priceAndStock.fillQuantity(data.quantity);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TẦNG 3: PUBLIC FACADE METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Mỗi method ở đây chỉ là 1-liner delegate xuống sections.
  // KHÔNG có logic riêng — tránh duplicate code.
  //
  // MỤC ĐÍCH: Cho phép test gọi ngắn gọn:
  //   await addNewProductPage.fillUnitPrice(100);
  // thay vì phải viết dài:
  //   await addNewProductPage.sections.priceAndStock.fillUnitPrice(100);
  //
  // LƯU Ý: Nếu test cần fill nhiều fields cùng lúc, dùng sections.xxx.fill()
  // sẽ gọn hơn là gọi từng facade method.
  // ═══════════════════════════════════════════════════════════════════════════

  // General Tab
  async fillProductName(name: string) { return this.sections.general.fillProductName(name); }
  async selectFirstCategory() { return this.sections.general.selectFirstCategory(); }
  async selectCategory(categoryText: string) { return this.sections.general.selectCategory(categoryText); }
  async selectFirstBrand() { return this.sections.general.selectFirstBrand(); }
  async selectBrand(brandText: string) { return this.sections.general.selectBrand(brandText); }
  async fillUnit(unit: string) { return this.sections.general.fillUnit(unit); }
  async fillWeight(weight: number) { return this.sections.general.fillWeight(weight); }
  async fillMinQty(qty: number) { return this.sections.general.fillMinQty(qty); }
  async fillTags(tags: string[]) { return this.sections.general.fillTags(tags); }
  async fillBarcode(barcode: string) { return this.sections.general.fillBarcode(barcode); }
  async fillDescription(description: string) { return this.sections.general.fillDescription(description); }
  async toggleFeatured(enabled: boolean) { return this.sections.general.toggleFeatured(enabled); }
  async toggleTodaysDeal(enabled: boolean) { return this.sections.general.toggleTodaysDeal(enabled); }
  async selectFlashDeal(dealText: string) { return this.sections.general.selectFlashDeal(dealText); }
  async fillFlashDiscount(discount: number) { return this.sections.general.fillFlashDiscount(discount); }
  async selectFlashDiscountType(type: 'Flat' | 'Percent') { return this.sections.general.selectFlashDiscountType(type); }
  async fillTax(tax: number) { return this.sections.general.fillTax(tax); }
  async selectTaxType(type: 'Flat' | 'Percent') { return this.sections.general.selectTaxType(type); }

  // Files & Media Tab
  async uploadGalleryImages(fileIndex: number = 0) { return this.sections.filesAndMedia.uploadGalleryImages(fileIndex); }
  async uploadGalleryImagesFromFile(filePath: string) { return this.sections.filesAndMedia.uploadGalleryImagesFromFile(filePath); }
  async uploadThumbnailImage(fileIndex: number = 0) { return this.sections.filesAndMedia.uploadThumbnailImage(fileIndex); }
  async uploadThumbnailImageFromFile(filePath: string) { return this.sections.filesAndMedia.uploadThumbnailImageFromFile(filePath); }
  async selectVideoProvider(provider: 'Youtube' | 'Dailymotion' | 'Vimeo') { return this.sections.filesAndMedia.selectVideoProvider(provider); }
  async fillVideoLink(link: string) { return this.sections.filesAndMedia.fillVideoLink(link); }
  async uploadPDF(filePath: string) { return this.sections.filesAndMedia.uploadPDF(filePath); }

  // Price & Stock Tab
  async fillUnitPrice(price: number) { return this.sections.priceAndStock.fillUnitPrice(price); }
  async fillDiscountDateRange(startDate: string, endDate: string) { return this.sections.priceAndStock.fillDiscountDateRange(startDate, endDate); }
  async fillDiscount(discount: number) { return this.sections.priceAndStock.fillDiscount(discount); }
  async selectDiscountType(type: 'Flat' | 'Percent') { return this.sections.priceAndStock.selectDiscountType(type); }
  async fillQuantity(qty: number) { return this.sections.priceAndStock.fillQuantity(qty); }
  async fillSKU(sku: string) { return this.sections.priceAndStock.fillSKU(sku); }
  async fillExternalLink(link: string) { return this.sections.priceAndStock.fillExternalLink(link); }
  async fillExternalLinkBtn(text: string) { return this.sections.priceAndStock.fillExternalLinkBtn(text); }
  async toggleColorsActive(enabled: boolean) { return this.sections.priceAndStock.toggleColorsActive(enabled); }
  async selectColors(colorTexts: string[]) { return this.sections.priceAndStock.selectColors(colorTexts); }
  async selectAttributes(attributeTexts: string[]) { return this.sections.priceAndStock.selectAttributes(attributeTexts); }
  async fillLowStockQuantity(qty: number) { return this.sections.priceAndStock.fillLowStockQuantity(qty); }
  async selectStockVisibility(state: 'quantity' | 'text' | 'hide') { return this.sections.priceAndStock.selectStockVisibility(state); }

  // SEO Tab
  async fillMetaTitle(title: string) { return this.sections.seo.fillMetaTitle(title); }
  async fillMetaDescription(description: string) { return this.sections.seo.fillMetaDescription(description); }
  async uploadMetaImage(filePath: string) { return this.sections.seo.uploadMetaImage(filePath); }

  // Shipping Tab
  async toggleCashOnDelivery(enabled: boolean) { return this.sections.shipping.toggleCashOnDelivery(enabled); }
  async toggleFreeShipping(enabled: boolean) { return this.sections.shipping.toggleFreeShipping(enabled); }
  async toggleFlatRate(enabled: boolean) { return this.sections.shipping.toggleFlatRate(enabled); }
  async fillFlatShippingCost(cost: number) { return this.sections.shipping.fillFlatShippingCost(cost); }
  async toggleIsQuantityMultiplied(enabled: boolean) { return this.sections.shipping.toggleIsQuantityMultiplied(enabled); }
  async fillEstShippingDays(days: number) { return this.sections.shipping.fillEstShippingDays(days); }

  // Warranty Tab
  async toggleHasWarranty(enabled: boolean) { return this.sections.warranty.toggleHasWarranty(enabled); }
  async selectWarranty(warrantyText: string) { return this.sections.warranty.selectWarranty(warrantyText); }

  // Frequently Bought Tab
  async selectFrequentlyBoughtSelectionType(type: 'product' | 'category') { return this.sections.frequentlyBought.selectSelectionType(type); }
  async selectFrequentlyBoughtCategory(categoryText: string) { return this.sections.frequentlyBought.selectCategory(categoryText); }
}
