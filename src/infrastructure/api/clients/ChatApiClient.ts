import { APIRequestContext, APIResponse } from "@playwright/test";
import { BaseApiClient } from "./BaseApiClient";
import {
  ChatSchemas,
  type OnlineUsersResponse,
} from "../schemas/neko/ChatSchemas";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 💬 CHAT API CLIENT (AOM - API OBJECT MODEL)
 * ════════════════════════════════════════════════════════════════════════════
 * Quản lý trạng thái trực tuyến của người dùng và các dịch vụ Chat:
 * - Lấy danh sách người dùng đang online (GET /ws/online)
 * - Kiểm tra trạng thái online của một user cụ thể
 * - Thống kê số lượng người dùng online trong hệ thống
 */
export class ChatApiClient extends BaseApiClient {
  constructor(request: APIRequestContext, authToken?: string) {
    super(request, authToken);
  }

  // ── 1. HTTP RAW METHODS ──

  /**
   * Gửi GET request tới endpoint /ws/online
   * @returns APIResponse nguyên gốc của Playwright
   */
  public async getOnline(): Promise<APIResponse> {
    return this.get("/ws/online");
  }

  // ── 2. SMART DATA METHODS (Tự động thẩm định qua Zod Schema) ──

  /**
   * ⚡ Smart Data Method: Lấy danh sách users đang online và tự động validate qua ChatSchemas.OnlineUsers.
   */
  public async getOnlineUsers(): Promise<OnlineUsersResponse> {
    const response = await this.getOnline();
    return this.parseResponse(response, ChatSchemas.OnlineUsers);
  }

  /**
   * Kiểm tra xem một userId có đang online hay không
   */
  public async isUserOnline(userId: number): Promise<boolean> {
    const data = await this.getOnlineUsers();
    return data.online_users.includes(userId);
  }

  /**
   * Lấy tổng số người dùng đang online
   */
  public async getOnlineCount(): Promise<number> {
    const data = await this.getOnlineUsers();
    return data.count;
  }
}
