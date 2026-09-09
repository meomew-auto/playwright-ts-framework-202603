import { APIRequestContext, APIResponse } from "@playwright/test";
import { BaseApiClient, PlaywrightPostOptions } from "./BaseApiClient";
import { pingResponseSchema, PingResponse } from "../schemas/neko";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🧪 ECHO & SYSTEM HEALTH API CLIENT (AOM)
 * ════════════════════════════════════════════════════════════════════════════
 * Quản lý kiểm tra sức khỏe hệ thống (Health Check, Ping) và echo payload:
 * - Ping máy chủ (GET /public/test/ping)
 * - Echo JSON (POST /public/test/echo)
 * - Echo Form Multipart (POST /public/test/echo-form)
 */
export class EchoApiClient extends BaseApiClient {
  constructor(request: APIRequestContext, authToken?: string) {
    super(request, authToken);
  }

  public async ping(): Promise<APIResponse> {
    return this.get("/public/test/ping");
  }

  /**
   * ⚡ Smart Data Method: Gọi ping và tự động thẩm định qua pingResponseSchema
   */
  public async pingData(): Promise<PingResponse> {
    const response = await this.ping();
    return this.parseResponse(response, pingResponseSchema);
  }

  public async echoJson(
    data: unknown,
    customHeaders?: Record<string, string>,
  ): Promise<APIResponse> {
    return this.post("/public/test/echo", { data, headers: customHeaders });
  }

  public async echoForm(multipart: PlaywrightPostOptions["multipart"]): Promise<APIResponse> {
    return this.post("/public/test/echo-form", { multipart });
  }

  public async echoUrlEncoded(form: PlaywrightPostOptions["form"]): Promise<APIResponse> {
    return this.post("/public/test/echo", { form });
  }

  public async echoOctetStream(
    buffer: Buffer,
    headers?: Record<string, string>,
  ): Promise<APIResponse> {
    return this.post("/public/test/echo", {
      headers: {
        "Content-Type": "application/octet-stream",
        ...headers,
      },
      data: buffer,
    });
  }
}
