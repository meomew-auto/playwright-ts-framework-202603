import { APIRequestContext, APIResponse } from "@playwright/test";
import { BaseApiClient } from "./BaseApiClient";
import {
  ProductFilterQuery,
  productListResponseSchema,
  ProductListResponse,
  nekoProductDetailSchema,
  NekoProductDetail,
  uploadProductImageResponseSchema,
  UploadProductImageResponse,
} from "../schemas/neko";
import { ProductSchemas } from "../schemas/neko/ProductSchemas";
import { ErrorSchemas, type AnyError } from "../schemas/neko/ErrorSchemas";
import type {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductPatch,
} from "../schemas/neko/ProductSchemas";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * ☕ PRODUCT API CLIENT (AOM - API OBJECT MODEL)
 * ════════════════════════════════════════════════════════════════════════════
 * Quản lý danh mục sản phẩm, kho hàng, lọc sản phẩm và upload hình ảnh:
 * - Lấy danh sách sản phẩm công khai (GET /public/products)
 * - Lấy chi tiết sản phẩm (GET /public/products/{id})
 * - Tạo sản phẩm mới (POST /api/products)
 * - Cập nhật sản phẩm (PUT /api/products/{id})
 * - Xóa sản phẩm (DELETE /api/products/{id})
 * - Tải ảnh sản phẩm (POST /api/products/{id}/image)
 */
export class ProductApiClient extends BaseApiClient {
  constructor(request: APIRequestContext, authToken?: string) {
    super(request, authToken);
  }

  // ── 1. HTTP RAW METHODS (Kiểm tra Status Code HTTP, Header, Test lỗi 4xx/5xx) ──

  public async getProducts(query?: ProductFilterQuery): Promise<APIResponse> {
    return this.get("/public/products", { params: query });
  }

  public async getProductById(id: number | string): Promise<APIResponse> {
    return this.get(`/public/products/${id}`);
  }

  public async createProduct(payload: {
    name: string;
    price_per_unit: number;
    type?: string;
    unit_type?: string;
    origin?: string;
    roast_level?: string;
    description?: string;
  }): Promise<APIResponse> {
    return this.post("/api/products", { data: payload });
  }

  public async updateProduct(
    id: number | string,
    payload: Record<string, unknown>,
  ): Promise<APIResponse> {
    return this.put(`/api/products/${id}`, { data: payload });
  }

  public async deleteProduct(id: number | string): Promise<APIResponse> {
    return this.delete(`/api/products/${id}`);
  }

  public async uploadImage(
    productId: number | string,
    imagePayload: { name: string; mimeType: string; buffer: Buffer },
    tokenOverride?: string,
  ): Promise<APIResponse> {
    const headers = tokenOverride
      ? { Authorization: `Bearer ${tokenOverride}` }
      : undefined;
    return this.post(`/api/products/${productId}/image`, {
      headers,
      multipart: {
        image: imagePayload,
      },
    });
  }

  // ── 2. SMART DATA METHODS (Tự động thẩm định Zod Contract & trả về dữ liệu an toàn kiểu) ──

  /**
   * ⚡ Smart Data Method: Lấy danh sách sản phẩm và tự động validate qua productListResponseSchema.
   */
  public async getProductsData(
    query?: ProductFilterQuery,
  ): Promise<ProductListResponse> {
    const response = await this.getProducts(query);
    return this.parseResponse(response, productListResponseSchema);
  }

  /**
   * ⚡ Smart Data Method: Lấy chi tiết sản phẩm và tự động validate qua nekoProductDetailSchema.
   */
  public async getProductByIdData(
    id: number | string,
  ): Promise<NekoProductDetail> {
    const response = await this.getProductById(id);
    return this.parseResponse(response, nekoProductDetailSchema);
  }

  /**
   * ⚡ Smart Data Method: Upload hình ảnh và tự động validate qua uploadProductImageResponseSchema.
   */
  public async uploadImageData(
    productId: number | string,
    imagePayload: { name: string; mimeType: string; buffer: Buffer },
    tokenOverride?: string,
  ): Promise<UploadProductImageResponse> {
    const response = await this.uploadImage(
      productId,
      imagePayload,
      tokenOverride,
    );
    return this.parseResponse(response, uploadProductImageResponseSchema);
  }

  /**
   * Tạo sản phẩm RAW (không validate response, trả về APIResponse)
   * Dùng cho kịch bản cần thẩm định status code hoặc payload bất kỳ
   */
  public async createProductRaw(data: unknown): Promise<APIResponse> {
    return this.post("/api/products", { data });
  }

  /**
   * ⚡ Smart Data Method: Tạo sản phẩm mới và tự động thẩm định qua ProductSchemas.Product.
   */
  public async createProductData(data: ProductCreate): Promise<Product> {
    const response = await this.createProductRaw(data);
    if (!response.ok()) {
      const errBody = await response.text();
      throw new Error(`API Error ${response.status()}: ${errBody}`);
    }
    return this.parseResponse(response, ProductSchemas.Product);
  }

  /**
   * Tạo sản phẩm MONG ĐỢI LỖI - dùng cho negative tests (400, 422, ...)
   */
  public async createProductExpectError(
    data: unknown,
    expectedStatus: number | number[] = [400, 422],
  ): Promise<AnyError> {
    const response = await this.createProductRaw(data);
    const statuses = Array.isArray(expectedStatus)
      ? expectedStatus
      : [expectedStatus];
    if (!statuses.includes(response.status())) {
      const body = await response.text();
      throw new Error(
        `Expected status ${statuses.join("|")}, got ${response.status()}. Body: ${body}`,
      );
    }
    return this.parseResponse(response, ErrorSchemas.AnyError);
  }

  /**
   * ⚡ Smart Data Method: Lấy sản phẩm theo ID và tự động validate qua ProductSchemas.Product.
   */
  public async getProductData(id: number | string): Promise<Product> {
    const response = await this.getProductById(id);
    return this.parseResponse(response, ProductSchemas.Product);
  }

  /**
   * ⚡ Smart Data Method: Cập nhật toàn bộ sản phẩm và tự động validate qua ProductSchemas.Product.
   */
  public async updateProductData(
    id: number | string,
    data: ProductUpdate,
  ): Promise<Product> {
    const response = await this.updateProduct(
      id,
      data as unknown as Record<string, unknown>,
    );
    return this.parseResponse(response, ProductSchemas.Product);
  }

  /**
   * ⚡ Smart Data Method: Cập nhật một phần sản phẩm (PATCH) và tự động validate qua ProductSchemas.Product.
   */
  public async patchProductData(
    id: number | string,
    data: ProductPatch,
  ): Promise<Product> {
    const response = await this.patch(`/api/products/${id}`, { data });
    return this.parseResponse(response, ProductSchemas.Product);
  }
}
