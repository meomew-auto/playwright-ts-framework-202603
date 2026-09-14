import { Locator, Page } from '@playwright/test';
import { BootstrapSelectHelper } from '@helpers/cms/BootstrapSelectHelper';

export type TabKey =
  | 'general'
  | 'files_and_media'
  | 'price_and_stocks'
  | 'seo'
  | 'shipping'
  | 'warranty'
  | 'frequenty_bought_product';

export interface ProductSectionContext {
  page: Page;
  element: (key: string, ...args: any[]) => Locator;
  helpers: BootstrapSelectHelper;
  ensureTab: (tab: TabKey) => Promise<void>;
  clickWithLog: (locator: Locator, options?: Parameters<Locator['click']>[0]) => Promise<void>;
  fillWithLog: (
    locator: Locator,
    value: string,
    options?: { isSensitive?: boolean; fillOptions?: Parameters<Locator['fill']>[1] }
  ) => Promise<void>;
  verifyFieldValues: (fields: Array<{ locator: Locator; expected: string | number | RegExp | boolean }>) => Promise<void>;
  selectImageFromModal: (browseButtonLocator: Locator, fileIndex?: number) => Promise<void>;
  uploadNewImageFromModal: (browseButtonLocator: Locator, filePath: string) => Promise<void>;
}
