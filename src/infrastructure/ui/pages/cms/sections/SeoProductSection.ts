import { ProductSectionContext } from './ProductSectionContext';

export interface SeoFillData {
  metaTitle?: string;
  metaDescription?: string;
  metaImage?: string;
}

export class SeoProductSection {
  constructor(private readonly ctx: ProductSectionContext) {}

  async fillMetaTitle(title: string): Promise<void> {
    await this.ctx.ensureTab('seo');
    await this.ctx.fillWithLog(this.ctx.element('metaTitleInput'), title);
  }

  async fillMetaDescription(description: string): Promise<void> {
    await this.ctx.ensureTab('seo');
    await this.ctx.fillWithLog(this.ctx.element('metaDescriptionTextarea'), description);
  }

  async uploadMetaImage(filePath: string): Promise<void> {
    await this.ctx.ensureTab('seo');
    const fileInput = this.ctx.page.locator('div[data-toggle="aizuploader"][data-type="image"]').nth(2).locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
  }

  async uploadMetaImageFromFile(filePath: string): Promise<void> {
    return this.uploadMetaImage(filePath);
  }

  async fill(data: SeoFillData): Promise<void> {
    if (data.metaTitle) await this.fillMetaTitle(data.metaTitle);
    if (data.metaDescription) await this.fillMetaDescription(data.metaDescription);
    if (data.metaImage) await this.uploadMetaImage(data.metaImage);
  }
}
