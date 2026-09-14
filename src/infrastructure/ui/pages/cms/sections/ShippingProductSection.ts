import { ProductSectionContext } from './ProductSectionContext';

export interface ShippingFillData {
  cashOnDelivery?: boolean;
  freeShipping?: boolean;
  flatRate?: boolean;
  flatShippingCost?: number;
  isQuantityMultiplied?: boolean;
  estShippingDays?: number;
}

export class ShippingProductSection {
  constructor(private readonly ctx: ProductSectionContext) {}

  async toggleCashOnDelivery(enabled: boolean): Promise<void> {
    await this.ctx.ensureTab('shipping');
    const checkbox = this.ctx.element('cashOnDeliveryCheckbox');
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await this.ctx.element('cashOnDeliveryLabel').click();
    }
  }

  async toggleFreeShipping(enabled: boolean): Promise<void> {
    await this.ctx.ensureTab('shipping');
    const radio = this.ctx.element('freeShippingRadio');
    const isChecked = await radio.isChecked();
    if (isChecked !== enabled) {
      await this.ctx.element('freeShippingLabel').click();
    }
  }

  async toggleFlatRate(enabled: boolean): Promise<void> {
    await this.ctx.ensureTab('shipping');
    const radio = this.ctx.element('flatRateRadio');
    const isChecked = await radio.isChecked();
    if (isChecked !== enabled) {
      await this.ctx.element('flatRateLabel').click();
    }
  }

  async fillFlatShippingCost(cost: number): Promise<void> {
    await this.ctx.ensureTab('shipping');
    await this.ctx.fillWithLog(this.ctx.element('flatShippingCostInput'), cost.toString());
  }

  async toggleIsQuantityMultiplied(enabled: boolean): Promise<void> {
    await this.ctx.ensureTab('shipping');
    const checkbox = this.ctx.element('isQuantityMultipliedCheckbox');
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await this.ctx.element('isQuantityMultipliedLabel').click();
    }
  }

  async fillEstShippingDays(days: number): Promise<void> {
    await this.ctx.ensureTab('shipping');
    await this.ctx.fillWithLog(this.ctx.element('estShippingDaysInput'), days.toString());
  }

  async fill(data: ShippingFillData): Promise<void> {
    if (data.cashOnDelivery !== undefined) await this.toggleCashOnDelivery(data.cashOnDelivery);
    if (data.freeShipping !== undefined) await this.toggleFreeShipping(data.freeShipping);
    if (data.flatRate !== undefined) await this.toggleFlatRate(data.flatRate);
    if (data.flatShippingCost !== undefined) await this.fillFlatShippingCost(data.flatShippingCost);
    if (data.isQuantityMultiplied !== undefined) await this.toggleIsQuantityMultiplied(data.isQuantityMultiplied);
    if (data.estShippingDays !== undefined) await this.fillEstShippingDays(data.estShippingDays);
  }
}
