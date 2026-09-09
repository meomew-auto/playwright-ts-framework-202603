import { APIRequestContext, APIResponse } from "@playwright/test";
import { z } from "zod";

export type PlaywrightPostOptions = NonNullable<Parameters<APIRequestContext["post"]>[1]>;

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🏛️ BASE API CLIENT (TẦNG NỀN TẢNG CHO TẤT CẢ DOMAIN API CLIENTS - AOM)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Nhiệm vụ kiến trúc:
 * 1. Đóng gói APIRequestContext của Playwright.
 * 2. Quản lý Bearer Token an toàn và tự động tiêm Header Authorization.
 * 3. Chuẩn hóa các phương thức HTTP (GET, POST, PUT, PATCH, DELETE, HEAD).
 * 4. Tích hợp ZOD RUNTIME VALIDATION: Tự động kiểm định Hợp đồng phản hồi từ Backend!
 *
 * @pattern API Object Model (AOM) + Single Responsibility
 */
export abstract class BaseApiClient {
  protected request: APIRequestContext;
  protected authToken?: string;

  constructor(request: APIRequestContext, authToken?: string) {
    this.request = request;
    this.authToken = authToken;
  }

  /**
   * Cập nhật Bearer Token động cho client
   */
  public setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Lấy Bearer Token hiện tại của client
   */
  public getAuthToken(): string | undefined {
    return this.authToken;
  }

  /**
   * Xây dựng Headers chuẩn hóa cho mọi request
   */
  protected buildHeaders(
    customHeaders?: Record<string, string>,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...customHeaders,
    };

    if (this.authToken && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Gửi HTTP GET request
   */
  public async get(
    endpoint: string,
    options?: {
      params?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
    },
  ): Promise<APIResponse> {
    return this.request.get(endpoint, {
      params: options?.params,
      headers: this.buildHeaders(options?.headers),
    });
  }

  /**
   * Gửi HTTP POST request
   */
  public async post(
    endpoint: string,
    options?: {
      data?: unknown;
      form?: PlaywrightPostOptions["form"];
      multipart?: PlaywrightPostOptions["multipart"];
      headers?: Record<string, string>;
    },
  ): Promise<APIResponse> {
    return this.request.post(endpoint, {
      data: options?.data,
      form: options?.form,
      multipart: options?.multipart,
      headers: this.buildHeaders(options?.headers),
    });
  }

  /**
   * Gửi HTTP PUT request
   */
  public async put(
    endpoint: string,
    options?: { data?: unknown; headers?: Record<string, string> },
  ): Promise<APIResponse> {
    return this.request.put(endpoint, {
      data: options?.data,
      headers: this.buildHeaders(options?.headers),
    });
  }

  /**
   * Gửi HTTP PATCH request
   */
  public async patch(
    endpoint: string,
    options?: { data?: unknown; headers?: Record<string, string> },
  ): Promise<APIResponse> {
    return this.request.patch(endpoint, {
      data: options?.data,
      headers: this.buildHeaders(options?.headers),
    });
  }

  /**
   * Gửi HTTP DELETE request
   */
  public async delete(
    endpoint: string,
    options?: { headers?: Record<string, string> },
  ): Promise<APIResponse> {
    return this.request.delete(endpoint, {
      headers: this.buildHeaders(options?.headers),
    });
  }

  /**
   * Gửi HTTP HEAD request
   */
  public async head(
    endpoint: string,
    options?: { headers?: Record<string, string> },
  ): Promise<APIResponse> {
    return this.request.fetch(endpoint, {
      method: "HEAD",
      headers: this.buildHeaders(options?.headers),
    });
  }

  /**
   * 🛡️ Zod Runtime Contract Validator
   * Thẩm định phản hồi JSON từ Backend qua Zod Schema. Báo lỗi chi tiết nếu có Schema Drift.
   */
  public async parseResponse<T>(
    response: APIResponse,
    schema: z.ZodSchema<T>,
  ): Promise<T> {
    const json = await response.json();
    const result = schema.safeParse(json);
    if (!result.success) {
      console.error(
        "❌ [ZOD SCHEMA VALIDATION FAILED]",
        JSON.stringify(result.error.issues, null, 2),
      );
      throw new Error(
        `Dữ liệu phản hồi từ API không khớp với Hợp đồng Zod: ${JSON.stringify(result.error.issues)}`,
      );
    }
    return result.data;
  }
}
