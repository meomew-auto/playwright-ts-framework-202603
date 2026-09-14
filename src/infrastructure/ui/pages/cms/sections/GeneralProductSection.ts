import { expect, Locator } from '@playwright/test';
import { ProductSectionContext } from './ProductSectionContext';

export interface GeneralFillData {
  // Product Information
  name?: string;
  category?: string | null;
  brand?: string | null;
  unit?: string;
  weight?: number;
  minQty?: number;
  tags?: string[];
  barcode?: string;
  // Description
  description?: string;
  // Status
  featured?: boolean;
  todaysDeal?: boolean;
  // Flash Deal
  flashDeal?: string;
  flashDiscount?: number;
  flashDiscountType?: 'Flat' | 'Percent';
  // Tax
  tax?: number;
  taxType?: 'Flat' | 'Percent';
}

export interface GeneralVerifyData {
  name?: string | RegExp;
  unit?: string;
  weight?: number;
  minQty?: number;
  barcode?: string;
  featured?: boolean;
  todaysDeal?: boolean;
  tax?: number;
  flashDiscount?: number;
}

export class GeneralProductSection {
  constructor(private readonly ctx: ProductSectionContext) {}

  async fillProductName(name: string): Promise<void> {
    await this.ctx.ensureTab('general');
    await this.ctx.fillWithLog(this.ctx.element('productNameInput'), name);
  }

  async selectFirstCategory(): Promise<void> {
    await this.ctx.ensureTab('general');
    const firstRadio = this.ctx.page.locator('input[name="category_id"]').first();
    await expect(firstRadio).toBeVisible();
    await firstRadio.scrollIntoViewIfNeeded();
    if (!(await firstRadio.isChecked())) {
      await firstRadio.click();
    }
  }

  async selectCategory(text: string): Promise<void> {
    await this.ctx.ensureTab('general');
    const categoryLabel = this.ctx.page
      .locator('label')
      .filter({ hasText: new RegExp(text, 'i') })
      .filter({ has: this.ctx.page.locator('input[name="category_ids[]"]') })
      .first();

    await expect(categoryLabel).toBeVisible();
    await categoryLabel.scrollIntoViewIfNeeded();

    const targetRadio = categoryLabel.locator('..').locator('input[name="category_id"]').first();
    await expect(targetRadio).toBeVisible();

    if (!(await targetRadio.isChecked())) {
      await targetRadio.click();
    }
  }

  async selectFirstBrand(): Promise<void> {
    await this.ctx.ensureTab('general');
    const selectElement = this.ctx.page.locator('select#brand_id');
    const options = selectElement.locator('option:not([value=""])');
    if (await options.count()) {
      const value = await options.first().getAttribute('value');
      if (value) {
        await selectElement.selectOption({ value });
        return;
      }
    }
    const selectButton = this.ctx.element('brandSelect');
    await expect(selectButton).toBeVisible();
    await this.ctx.clickWithLog(selectButton);
    const firstOption = this.ctx.page.locator('#bs-select-2 .dropdown-item, #bs-select-2 li a').first();
    await expect(firstOption).toBeVisible();
    await this.ctx.clickWithLog(firstOption);
  }

  async selectBrand(text: string): Promise<void> {
    await this.ctx.ensureTab('general');
    await this.ctx.helpers.selectBootstrapOption(this.ctx.element('brandSelect'), text);
  }

  async fillUnit(unit: string): Promise<void> {
    await this.ctx.ensureTab('general');
    await this.ctx.fillWithLog(this.ctx.element('unitInput'), unit);
  }

  async fillWeight(weight: number): Promise<void> {
    await this.ctx.ensureTab('general');
    await this.ctx.fillWithLog(this.ctx.element('weightInput'), weight.toString());
  }

  async fillMinQty(qty: number): Promise<void> {
    await this.ctx.ensureTab('general');
    await this.ctx.fillWithLog(this.ctx.element('minQtyInput'), qty.toString());
  }

  async fillTags(tags: string[]): Promise<void> {
    await this.ctx.ensureTab('general');
    const tagifyElement = this.ctx.element('tagsTagify');
    const tagifyInput = this.ctx.element('tagsTagifyInput');
    await expect(tagifyElement).toBeVisible();
    await expect(tagifyInput).toBeVisible();
    for (const tag of tags) {
      await tagifyInput.click();
      await tagifyInput.press('Control+A');
      await tagifyInput.press('Delete');
      await tagifyInput.pressSequentially(tag, { delay: 50 });
      await tagifyInput.press('Enter');
    }
  }

  async fillBarcode(barcode: string): Promise<void> {
    await this.ctx.ensureTab('general');
    await this.ctx.fillWithLog(this.ctx.element('barcodeInput'), barcode);
  }

  async fillDescription(description: string): Promise<void> {
    await this.ctx.ensureTab('general');
    await this.ctx.element('descriptionEditor').fill(description);
  }

  async toggleFeatured(enabled: boolean): Promise<void> {
    await this.ctx.ensureTab('general');
    const checkbox = this.ctx.element('featuredCheckbox');
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await this.ctx.element('featuredLabel').click();
    }
  }

  async toggleTodaysDeal(enabled: boolean): Promise<void> {
    await this.ctx.ensureTab('general');
    const checkbox = this.ctx.element('todaysDealCheckbox');
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await this.ctx.element('todaysDealLabel').click();
    }
  }

  async selectFlashDeal(dealText: string): Promise<void> {
    await this.ctx.ensureTab('general');
    await this.ctx.helpers.selectBootstrapOption(this.ctx.element('flashDealSelect'), dealText);
  }

  async fillFlashDiscount(discount: number): Promise<void> {
    await this.ctx.ensureTab('general');
    await this.ctx.fillWithLog(this.ctx.element('flashDiscountInput'), discount.toString());
  }

  async selectFlashDiscountType(type: 'Flat' | 'Percent'): Promise<void> {
    await this.ctx.ensureTab('general');
    await this.ctx.helpers.selectBootstrapOption(this.ctx.element('flashDiscountTypeSelect'), type);
  }

  async fillTax(taxValue: number): Promise<void> {
    await this.ctx.ensureTab('general');
    await this.ctx.fillWithLog(this.ctx.element('taxInput'), taxValue.toString());
  }

  async selectTaxType(type: 'Flat' | 'Percent'): Promise<void> {
    await this.ctx.ensureTab('general');
    await this.ctx.helpers.selectBootstrapOption(this.ctx.element('taxTypeSelect'), type);
  }

  async fill(data: GeneralFillData): Promise<void> {
    if (data.name) await this.fillProductName(data.name);
    if (data.category !== undefined) {
      if (data.category === null) await this.selectFirstCategory();
      else await this.selectCategory(data.category);
    }
    if (data.brand !== undefined) {
      if (data.brand === null) await this.selectFirstBrand();
      else await this.selectBrand(data.brand);
    }
    if (data.unit) await this.fillUnit(data.unit);
    if (data.weight !== undefined) await this.fillWeight(data.weight);
    if (data.minQty !== undefined) await this.fillMinQty(data.minQty);
    if (data.tags && data.tags.length > 0) await this.fillTags(data.tags);
    if (data.barcode) await this.fillBarcode(data.barcode);
    if (data.description) await this.fillDescription(data.description);
    if (data.featured !== undefined) await this.toggleFeatured(data.featured);
    if (data.todaysDeal !== undefined) await this.toggleTodaysDeal(data.todaysDeal);
    if (data.flashDeal) await this.selectFlashDeal(data.flashDeal);
    if (data.flashDiscount !== undefined) await this.fillFlashDiscount(data.flashDiscount);
    if (data.flashDiscountType) await this.selectFlashDiscountType(data.flashDiscountType);
    if (data.tax !== undefined) await this.fillTax(data.tax);
    if (data.taxType) await this.selectTaxType(data.taxType);
  }

  async verify(data: GeneralVerifyData): Promise<void> {
    const fields = [
      data.name !== undefined && { locator: this.ctx.element('productNameInput'), expected: data.name },
      data.unit !== undefined && { locator: this.ctx.element('unitInput'), expected: data.unit },
      data.weight !== undefined && { locator: this.ctx.element('weightInput'), expected: data.weight },
      data.minQty !== undefined && { locator: this.ctx.element('minQtyInput'), expected: data.minQty },
      data.barcode !== undefined && { locator: this.ctx.element('barcodeInput'), expected: data.barcode },
      data.featured !== undefined && { locator: this.ctx.element('featuredCheckbox'), expected: data.featured },
      data.todaysDeal !== undefined && { locator: this.ctx.element('todaysDealCheckbox'), expected: data.todaysDeal },
      data.tax !== undefined && { locator: this.ctx.element('taxInput'), expected: data.tax },
      data.flashDiscount !== undefined && { locator: this.ctx.element('flashDiscountInput'), expected: data.flashDiscount },
    ].filter(Boolean) as Array<{ locator: Locator; expected: string | number | RegExp | boolean }>;
    await this.ctx.verifyFieldValues(fields);
  }
}
