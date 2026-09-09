import { APIRequestContext, APIResponse } from "@playwright/test";
import { BaseApiClient } from "./BaseApiClient";
import type {
  Order,
  OrderFilterParams,
  OrderPaginationResponse,
} from "../schemas/neko/order.schema";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 📦 ORDER API CLIENT (AOM - API OBJECT MODEL)
 * ════════════════════════════════════════════════════════════════════════════
 * Quản lý đơn hàng, tra cứu trạng thái và xử lý chuyển đổi trạng thái đơn hàng:
 * - Lấy danh sách đơn hàng (GET /api/orders)
 * - Lấy chi tiết đơn hàng (GET /api/orders/{id})
 * - Cập nhật trạng thái đơn hàng (PATCH /api/orders/{id}/status)
 * - Tra cứu đơn hàng công khai của khách (GET /public/orders/{code})
 */
export class OrderApiClient extends BaseApiClient {
  constructor(request: APIRequestContext, authToken?: string) {
    super(request, authToken);
  }

  public async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<APIResponse> {
    return this.get("/api/orders", { params });
  }

  public async getOrderById(id: number | string): Promise<APIResponse> {
    return this.get(`/api/orders/${id}`);
  }

  public async getOrderByCode(code: string): Promise<APIResponse> {
    return this.get(`/public/orders/${encodeURIComponent(code)}`);
  }

  public async updateOrderStatus(
    id: number | string,
    status: string,
  ): Promise<APIResponse> {
    return this.patch(`/api/orders/${id}/status`, {
      data: { status },
    });
  }

  public async createOrder(orderPayload: {
    items: Array<{ product_id: number; quantity: number }>;
    shipping_address?: string;
    customer_name?: string;
    customer_phone?: string;
  }): Promise<APIResponse> {
    return this.post("/api/orders", { data: orderPayload });
  }

  // ── 2. SMART DATA METHODS ──

  /**
   * ⚡ Smart Data Method: Lấy danh sách orders có phân trang và trả về typed data
   */
  public async getOrdersData(
    params?: OrderFilterParams,
  ): Promise<OrderPaginationResponse> {
    const response = await this.getOrders(
      params as {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
      },
    );
    return response.json();
  }

  /**
   * ⚡ Smart Data Method: Lấy chi tiết order theo ID và trả về typed data
   */
  public async getOrderData(id: number | string): Promise<Order> {
    const response = await this.getOrderById(id);
    return response.json();
  }
}

