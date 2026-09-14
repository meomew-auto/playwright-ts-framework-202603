import { expect } from '@playwright/test';
import { ProductSectionContext } from './ProductSectionContext';

export interface FilesAndMediaFillData {
  galleryImages?: number | string; // index hoặc filePath
  thumbnailImage?: number | string;
  videoProvider?: 'Youtube' | 'Dailymotion' | 'Vimeo';
  videoLink?: string;
  pdf?: string;
  pdfFilePath?: string;
}

export class FilesAndMediaProductSection {
  constructor(private readonly ctx: ProductSectionContext) {}

  async uploadGalleryImages(fileIndex: number = 0): Promise<void> {
    await this.ctx.ensureTab('files_and_media');
    await this.ctx.selectImageFromModal(this.ctx.element('galleryImagesBrowse'), fileIndex);
  }

  async uploadGalleryImagesFromFile(filePath: string): Promise<void> {
    await this.ctx.ensureTab('files_and_media');
    await this.ctx.uploadNewImageFromModal(this.ctx.element('galleryImagesBrowse'), filePath);
  }

  async uploadThumbnailImage(fileIndex: number = 0): Promise<void> {
    await this.ctx.ensureTab('files_and_media');
    await this.ctx.selectImageFromModal(this.ctx.element('thumbnailImageBrowse'), fileIndex);
  }

  async uploadThumbnailImageFromFile(filePath: string): Promise<void> {
    await this.ctx.ensureTab('files_and_media');
    await this.ctx.uploadNewImageFromModal(this.ctx.element('thumbnailImageBrowse'), filePath);
  }

  async selectVideoProvider(provider: 'Youtube' | 'Dailymotion' | 'Vimeo'): Promise<void> {
    await this.ctx.ensureTab('files_and_media');
    const videoProviderButton = this.ctx.element('videoProviderSelect');
    const count = await videoProviderButton.count();
    if (count === 0) {
      console.log(`[Video Provider] Select không tồn tại trong UI mới, bỏ qua chọn provider "${provider}"`);
      return;
    }
    await this.ctx.helpers.selectBootstrapOption(videoProviderButton, provider);
  }

  async fillVideoLink(link: string): Promise<void> {
    await this.ctx.ensureTab('files_and_media');
    const videoLinkInput = this.ctx.page.locator('input[name="video_link[]"]').first();
    await expect(videoLinkInput).toBeVisible();
    await this.ctx.fillWithLog(videoLinkInput, link);
  }

  async uploadPDF(filePath: string): Promise<void> {
    await this.ctx.ensureTab('files_and_media');
    const fileInput = this.ctx.page.locator('div[data-toggle="aizuploader"][data-type="document"] input[type="file"]');
    await fileInput.setInputFiles(filePath);
  }

  async fill(data: FilesAndMediaFillData): Promise<void> {
    if (data.galleryImages !== undefined) {
      if (typeof data.galleryImages === 'number') {
        await this.uploadGalleryImages(data.galleryImages);
      } else {
        await this.uploadGalleryImagesFromFile(data.galleryImages);
      }
    }
    if (data.thumbnailImage !== undefined) {
      if (typeof data.thumbnailImage === 'number') {
        await this.uploadThumbnailImage(data.thumbnailImage);
      } else {
        await this.uploadThumbnailImageFromFile(data.thumbnailImage);
      }
    }
    if (data.videoProvider) await this.selectVideoProvider(data.videoProvider);
    const pdfFile = data.pdf || data.pdfFilePath;
    if (pdfFile) await this.uploadPDF(pdfFile);
  }
}
