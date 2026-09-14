import { ProductSectionContext } from './ProductSectionContext';

export interface WarrantyFillData {
  hasWarranty?: boolean;
  warranty?: string;
}

export class WarrantyProductSection {
  constructor(private readonly ctx: ProductSectionContext) {}

  async toggleHasWarranty(enabled: boolean): Promise<void> {
    await this.ctx.ensureTab('warranty');
    const checkbox = this.ctx.page.locator('input[name="has_warranty"]');
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      const label = this.ctx.page.locator('label.aiz-switch').filter({ has: checkbox });
      await label.click();
    }
  }

  async selectWarranty(warrantyText: string): Promise<void> {
    await this.ctx.ensureTab('warranty');
    const warrantyButton = this.ctx.page.locator('button[data-id="warranty_id"]');
    await this.ctx.helpers.selectBootstrapOption(warrantyButton, warrantyText);
  }

  async fill(data: WarrantyFillData): Promise<void> {
    if (data.hasWarranty !== undefined) await this.toggleHasWarranty(data.hasWarranty);
    if (data.warranty) await this.selectWarranty(data.warranty);
  }
}
