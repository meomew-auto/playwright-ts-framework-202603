import { test as base, type PlaywrightWorkerArgs } from "@playwright/test";
import { AuthApiClient } from "../../api/clients/AuthApiClient";
import { ProductApiClient } from "../../api/clients/ProductApiClient";
import { EchoApiClient } from "../../api/clients/EchoApiClient";
import { OrderApiClient } from "../../api/clients/OrderApiClient";
import { ChatApiClient } from "../../api/clients/ChatApiClient";
import { EnvManager } from "../../utils/EnvManager";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🌐 TẦNG API SERVICES FIXTURE (AOM - API OBJECT MODEL)
 * ════════════════════════════════════════════════════════════════════════════
 * Cung cấp bộ ngũ API Clients chuẩn mực kế thừa BaseApiClient (Bài 24):
 * 1. authApi: Quản lý đăng ký, đăng nhập, thông tin user
 * 2. productApi: Quản lý sản phẩm, danh mục, audit hợp đồng Zod, seed data
 * 3. echoApi: Kiểm thử mạng, ping, phản hồi header và payload
 * 4. orderApi: Quản lý đơn hàng, chuyển đổi trạng thái đơn hàng
 * 5. chatApi: Quản lý WebSocket online status và chat realtime
 *
 * Đồng thời hỗ trợ các alias productService, orderService, chatService
 * để tương thích ngược 100% với các test hiện hữu.
 */

export interface HybridServicesFixtures {
  authApi: AuthApiClient;
  productApi: ProductApiClient;
  echoApi: EchoApiClient;
  orderApi: OrderApiClient;
  chatApi: ChatApiClient;
  productService: ProductApiClient;
  orderService: OrderApiClient;
  chatService: ChatApiClient;
}

export const hybridServicesFixtures = {
  authApi: async (
    { playwright }: { playwright: PlaywrightWorkerArgs["playwright"] },
    use: (r: AuthApiClient) => Promise<void>,
  ) => {
    const apiBaseUrl = EnvManager.get(
      "NEKO_API_URL",
      "https://api-neko-coffee.autoneko.com",
    );
    const ctx = await playwright.request.newContext({ baseURL: apiBaseUrl });
    await use(new AuthApiClient(ctx));
    await ctx.dispose();
  },
  productApi: async (
    {
      staffToken,
      playwright,
    }: {
      staffToken: string;
      playwright: PlaywrightWorkerArgs["playwright"];
    },
    use: (r: ProductApiClient) => Promise<void>,
  ) => {
    const apiBaseUrl = EnvManager.get(
      "NEKO_API_URL",
      "https://api-neko-coffee.autoneko.com",
    );
    const ctx = await playwright.request.newContext({
      baseURL: apiBaseUrl,
      extraHTTPHeaders: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
    });
    await use(new ProductApiClient(ctx, staffToken));
    await ctx.dispose();
  },
  echoApi: async (
    { playwright }: { playwright: PlaywrightWorkerArgs["playwright"] },
    use: (r: EchoApiClient) => Promise<void>,
  ) => {
    const apiBaseUrl = EnvManager.get(
      "NEKO_API_URL",
      "https://api-neko-coffee.autoneko.com",
    );
    const ctx = await playwright.request.newContext({ baseURL: apiBaseUrl });
    await use(new EchoApiClient(ctx));
    await ctx.dispose();
  },
  orderApi: async (
    {
      staffToken,
      playwright,
    }: {
      staffToken: string;
      playwright: PlaywrightWorkerArgs["playwright"];
    },
    use: (r: OrderApiClient) => Promise<void>,
  ) => {
    const apiBaseUrl = EnvManager.get(
      "NEKO_API_URL",
      "https://api-neko-coffee.autoneko.com",
    );
    const ctx = await playwright.request.newContext({
      baseURL: apiBaseUrl,
      extraHTTPHeaders: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
    });
    await use(new OrderApiClient(ctx, staffToken));
    await ctx.dispose();
  },
  chatApi: async (
    {
      staffToken,
      playwright,
    }: {
      staffToken: string;
      playwright: PlaywrightWorkerArgs["playwright"];
    },
    use: (r: ChatApiClient) => Promise<void>,
  ) => {
    const apiBaseUrl = EnvManager.get(
      "NEKO_API_URL",
      "https://api-neko-coffee.autoneko.com",
    );
    const ctx = await playwright.request.newContext({
      baseURL: apiBaseUrl,
      extraHTTPHeaders: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
    });
    await use(new ChatApiClient(ctx, staffToken));
    await ctx.dispose();
  },

  // ── 3. TƯƠNG THÍCH NGƯỢC (Backward-Compatible Aliases) ──
  productService: async (
    { productApi }: { productApi: ProductApiClient },
    use: (r: ProductApiClient) => Promise<void>,
  ) => {
    await use(productApi);
  },
  orderService: async (
    { orderApi }: { orderApi: OrderApiClient },
    use: (r: OrderApiClient) => Promise<void>,
  ) => {
    await use(orderApi);
  },
  chatService: async (
    { chatApi }: { chatApi: ChatApiClient },
    use: (r: ChatApiClient) => Promise<void>,
  ) => {
    await use(chatApi);
  },
};

export const hybridServices =
  base.extend<HybridServicesFixtures & { staffToken: string }>(
    hybridServicesFixtures,
  );

