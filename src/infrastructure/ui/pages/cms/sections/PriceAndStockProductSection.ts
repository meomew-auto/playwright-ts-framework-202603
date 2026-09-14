import { Locator } from '@playwright/test';
import { ProductSectionContext } from './ProductSectionContext';

export interface PriceAndStockFillData {
  // Pricing
  unitPrice?: number;
  discountDateRange?: { startDate: string; endDate: string };
  discount?: number;
  discountType?: 'Flat' | 'Percent';
  quantity?: number;
  sku?: string;
  externalLink?: string;
  externalLinkBtn?: string;
  // Variations
  colorsActive?: boolean;
  colors?: string[];
  attributes?: string[];
  // Stock
  lowStockQuantity?: number;
  stockVisibilityState?: 'quantity' | 'text' | 'hide';
}

export interface PriceAndStockVerifyData {
  unitPrice?: number;
  discount?: number;
  quantity?: number;
  sku?: string;
  externalLink?: string;
  externalLinkBtn?: string;
  lowStockQuantity?: number;
  cashOnDelivery?: boolean;
}

export class PriceAndStockProductSection {
  constructor(private readonly ctx: ProductSectionContext) {}

  async fillUnitPrice(price: number): Promise<void> {
    await this.ctx.ensureTab('price_and_stocks');
    await this.ctx.fillWithLog(this.ctx.element('unitPriceInput'), price.toString());
  }

  async fillDiscountDateRange(startDate: string, endDate: string): Promise<void> {
    await this.ctx.ensureTab('price_and_stocks');
    const dateRange = `${startDate} to ${endDate}`;
    await this.ctx.fillWithLog(this.ctx.element('discountDateRangeInput'), dateRange);
  }

  async fillDiscount(discount: number): Promise<void> {
    await this.ctx.ensureTab('price_and_stocks');
    await this.ctx.fillWithLog(this.ctx.element('discountInput'), discount.toString());
  }

  async selectDiscountType(type: 'Flat' | 'Percent'): Promise<void> {
    await this.ctx.ensureTab('price_and_stocks');
    await this.ctx.helpers.selectBootstrapOption(this.ctx.element('discountTypeSelect'), type);
  }

  async fillQuantity(qty: number): Promise<void> {
    await this.ctx.ensureTab('price_and_stocks');
    await this.ctx.fillWithLog(this.ctx.element('quantityInput'), qty.toString());
  }

  async fillSKU(sku: string): Promise<void> {
    await this.ctx.ensureTab('price_and_stocks');
    await this.ctx.fillWithLog(this.ctx.element('skuInput'), sku);
  }

  async fillExternalLink(link: string): Promise<void> {
    await this.ctx.ensureTab('price_and_stocks');
    await this.ctx.fillWithLog(this.ctx.element('externalLinkInput'), link);
  }

  async fillExternalLinkBtn(text: string): Promise<void> {
    await this.ctx.ensureTab('price_and_stocks');
    await this.ctx.fillWithLog(this.ctx.element('externalLinkBtnInput'), text);
  }

  async toggleColorsActive(enabled: boolean): Promise<void> {
    await this.ctx.ensureTab('price_and_stocks');
    const checkbox = this.ctx.element('colorsActiveCheckbox');
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await this.ctx.element('colorsActiveLabel').click();
    }
  }

  async toggleColors(enabled: boolean): Promise<void> {
    return this.toggleColorsActive(enabled);
  }

  async selectColors(colorTexts: string[]): Promise<void> {
    await this.ctx.ensureTab('price_and_stocks');
    const colorsCheckbox = this.ctx.element('colorsActiveCheckbox');
    const isEnabled = await colorsCheckbox.isChecked();

    if (!isEnabled) {
      throw new Error('Colors chưa được bật. Hãy gọi toggleColorsActive(true) trước.');
    }

    const selectElement = this.ctx.page.locator('select[name="colors[]"]');
    const selectCount = await selectElement.count();

    if (selectCount > 0) {
      const colorValues: string[] = [];
      const options = selectElement.locator('option');
      const optionCount = await options.count();

      for (const colorText of colorTexts) {
        for (let i = 0; i < optionCount; i++) {
          const option = options.nth(i);
          const text = await option.textContent();
          if (text && text.trim().toLowerCase().includes(colorText.toLowerCase())) {
            const value = await option.getAttribute('value');
            if (value) {
              colorValues.push(value);
              break;
            }
          }
        }
      }

      if (colorValues.length > 0) {
        await selectElement.selectOption(colorValues);
        return;
      }
    }

    const selectButton = this.ctx.element('colorsSelect');
    await this.ctx.helpers.selectBootstrapOptions(selectButton, colorTexts);
  }

  async selectAttributes(attributeTexts: string[]): Promise<void> {
    await this.ctx.ensureTab('price_and_stocks');
    const selectElement = this.ctx.page.locator('select[name="choice_attributes[]"]');
    const selectCount = await selectElement.count();

    if (selectCount > 0) {
      const attributeValues: string[] = [];
      const options = selectElement.locator('option');
      const optionCount = await options.count();

      for (const attrText of attributeTexts) {
        for (let i = 0; i < optionCount; i++) {
          const option = options.nth(i);
          const text = await option.textContent();
          if (text && text.trim().toLowerCase().includes(attrText.toLowerCase())) {
            const value = await option.getAttribute('value');
            if (value) {
              attributeValues.push(value);
              break;
            }
          }
        }
      }

      if (attributeValues.length > 0) {
        await selectElement.selectOption(attributeValues);
        return;
      }
    }

    const selectButton = this.ctx.element('attributesSelect');
    await this.ctx.helpers.selectBootstrapOptions(selectButton, attributeTexts);
  }

  async fillLowStockQuantity(qty: number): Promise<void> {
    await this.ctx.ensureTab('price_and_stocks');
    await this.ctx.fillWithLog(this.ctx.element('lowStockQuantityInput'), qty.toString());
  }

  async selectStockVisibility(state: 'quantity' | 'text' | 'hide'): Promise<void> {
    await this.ctx.ensureTab('price_and_stocks');
    const radioMap = {
      quantity: this.ctx.element('stockVisibilityQuantityRadio'),
      text: this.ctx.element('stockVisibilityTextRadio'),
      hide: this.ctx.element('stockVisibilityHideRadio'),
    };

    const labelMap = {
      quantity: this.ctx.element('stockVisibilityQuantityLabel'),
      text: this.ctx.element('stockVisibilityTextLabel'),
      hide: this.ctx.element('stockVisibilityHideLabel'),
    };

    const targetRadio = radioMap[state];
    const targetLabel = labelMap[state];

    const isChecked = await targetRadio.isChecked();
    if (!isChecked) {
      await targetLabel.scrollIntoViewIfNeeded();
      await this.ctx.clickWithLog(targetLabel);
    }
  }

  async fill(data: PriceAndStockFillData): Promise<void> {
    if (data.unitPrice !== undefined) await this.fillUnitPrice(data.unitPrice);
    if (data.discountDateRange) await this.fillDiscountDateRange(data.discountDateRange.startDate, data.discountDateRange.endDate);
    if (data.discount !== undefined) await this.fillDiscount(data.discount);
    if (data.discountType) await this.selectDiscountType(data.discountType);
    if (data.quantity !== undefined) await this.fillQuantity(data.quantity);
    if (data.sku) await this.fillSKU(data.sku);
    if (data.externalLink) await this.fillExternalLink(data.externalLink);
    if (data.externalLinkBtn) await this.fillExternalLinkBtn(data.externalLinkBtn);
    if (data.colorsActive !== undefined) await this.toggleColorsActive(data.colorsActive);
    if (data.colors && data.colors.length > 0) await this.selectColors(data.colors);
    if (data.attributes && data.attributes.length > 0) await this.selectAttributes(data.attributes);
    if (data.lowStockQuantity !== undefined) await this.fillLowStockQuantity(data.lowStockQuantity);
    if (data.stockVisibilityState) await this.selectStockVisibility(data.stockVisibilityState);
  }

  async verify(data: PriceAndStockVerifyData): Promise<void> {
    const fields = [
      data.unitPrice !== undefined && { locator: this.ctx.element('unitPriceInput'), expected: data.unitPrice },
      data.discount !== undefined && { locator: this.ctx.element('discountInput'), expected: data.discount },
      data.quantity !== undefined && { locator: this.ctx.element('quantityInput'), expected: data.quantity },
      data.sku !== undefined && { locator: this.ctx.element('skuInput'), expected: data.sku },
      data.externalLink !== undefined && { locator: this.ctx.element('externalLinkInput'), expected: data.externalLink },
      data.externalLinkBtn !== undefined && { locator: this.ctx.element('externalLinkBtnInput'), expected: data.externalLinkBtn },
      data.lowStockQuantity !== undefined && { locator: this.ctx.element('lowStockQuantityInput'), expected: data.lowStockQuantity },
      data.cashOnDelivery !== undefined && { locator: this.ctx.element('cashOnDeliveryCheckbox'), expected: data.cashOnDelivery },
    ].filter(Boolean) as Array<{ locator: Locator; expected: string | number | RegExp | boolean }>;
    await this.ctx.verifyFieldValues(fields);
  }
}
