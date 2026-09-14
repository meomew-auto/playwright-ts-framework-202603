import { expect } from '@playwright/test';
import { ProductSectionContext } from './ProductSectionContext';

export interface FrequentlyBoughtFillData {
  selectionType?: 'product' | 'category';
  category?: string;
}

export class FrequentlyBoughtProductSection {
  constructor(private readonly ctx: ProductSectionContext) {}

  async selectSelectionType(type: 'product' | 'category'): Promise<void> {
    await this.ctx.ensureTab('frequenty_bought_product');
    const radio = this.ctx.page.locator(`input[name="frequently_bought_selection_type"][value="${type}"]`);
    await expect(radio).toBeVisible();
    if (!(await radio.isChecked())) {
      await radio.click();
    }
  }

  async selectCategory(categoryText: string): Promise<void> {
    await this.ctx.ensureTab('frequenty_bought_product');
    await this.selectSelectionType('category');
    const categoryButton = this.ctx.page
      .locator('select[name="fq_bought_product_category_id"]')
      .locator('..')
      .locator('button.dropdown-toggle')
      .first();
    await this.ctx.helpers.selectBootstrapOption(categoryButton, categoryText);
  }

  async fill(data: FrequentlyBoughtFillData): Promise<void> {
    if (data.selectionType) await this.selectSelectionType(data.selectionType);
    if (data.category) await this.selectCategory(data.category);
  }
}
