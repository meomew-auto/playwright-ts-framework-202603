/**
 * ============================================================================
 * CMS DATA TYPES — Type definitions cho CMS eCommerce products & UI forms
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Định nghĩa ProductInfo interface cho CMS (ActiveEcommerce platform).
 *
 * 🔗 LIÊN KẾT:
 * - Dùng bởi: data/cms/ProductDataFactory.ts (test data)
 * - Dùng bởi: pages/cms/CMSAddNewProductPage.ts (form automation)
 */
export interface ProductInfo {
  // Product Information
  name: string;
  category?: string;
  brand?: string;
  unit: string;
  weight?: number;
  minQty: number;
  tags?: string[];
  barcode?: string;

  // Product Price + Stock
  unitPrice: number;
  discount?: number;
  discountType?: 'Flat' | 'Percent';
  quantity: number;
  sku?: string;
  externalLink?: string;
  externalLinkBtn?: string;

  // Product Description
  description?: string;

  // SEO Meta Tags
  metaTitle?: string;
  metaDescription?: string;

  // Product Settings
  featured?: boolean;
  todaysDeal?: boolean;
  cashOnDelivery?: boolean;
  lowStockQuantity?: number;
  stockVisibilityState?: 'quantity' | 'text' | 'hide';

  // Product Variations
  colors?: string[];
  colorsActive?: boolean;
  attributes?: string[];

  // Video
  videoProvider?: 'Youtube' | 'Dailymotion' | 'Vimeo';
  videoLink?: string;

  // Flash Deal
  flashDeal?: string;
  flashDiscount?: number;
  flashDiscountType?: 'Flat' | 'Percent';

  // Shipping & Tax
  estShippingDays?: number;
  tax?: number;
  taxType?: 'Flat' | 'Percent';
}
