/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO ROLE FIXTURE — Multi-role testing cho Neko Coffee project
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Cho phép test sử dụng nhiều roles (admin, staff) trong cùng 1 test case.
 * Mỗi role có browser context riêng (isolated session) + POMs + API Services.
 *
 * 📚 CÁCH DÙNG:
 * ```typescript
 * import { test } from '@fixtures/neko/unified.fixture';
 *
 * test('Admin vs Staff', async ({ ordersPage, asRole }) => {
 *   // Admin — từ fixture mặc định (authedPage)
 *   await ordersPage.goto();
 *
 *   // Staff — isolated context + POMs + Services
 *   const staff = await asRole('staff');
 *   await staff.ordersPage.goto();
 *   const staffOrders = await staff.orderService.getOrders();
 * });
 * ```
 *
 * 📌 ARCHITECTURE:
 * - Độc lập, tự chứa logic tạo POMs + Services + Token cho multi-role
 * - Mỗi asRole() call tạo isolated browser context + fresh POMs + Services
 * - Tất cả contexts được track và cleanup khi test xong
 *
 * 📌 LAZY LOGIN:
 * - Admin: đã được login bởi neko.setup.ts (global setup)
 * - Roles khác (staff, manager): tự động login khi asRole() được gọi
 *   nếu storageState chưa tồn tại hoặc token hết hạn.
 *
 * 🔗 LIÊN KẾT:
 * - Dùng: NekoAuthProvider (getStorageStatePath)
 * - Merge bởi: hybrid-super-gatekeeper.fixture.ts
 */

import { test as base, Browser, BrowserContext, APIRequestContext, Page, request as playwrightRequest } from '@playwright/test';
import { ViewportType } from '@fixtures/common/ViewportType';
import { Logger } from '@utils/Logger';
import { EnvManager } from '@utils/EnvManager';
import { nekoAuth } from '@auth/neko/NekoAuthProvider';
import { getLocalStorageValue } from '@auth/storage-state.utils';

// ─── POMs ──────────────────────────────────────────────────────────────────
import { ProductsPage } from '@pages/neko/ProductsPage';
import { OrdersPage } from '@pages/neko/OrdersPage';
import { ChatPage } from '@pages/neko/ChatPage';

// ─── Clients & Services (AOM) ──────────────────────────────────────────────
import {
  AuthApiClient,
  ProductApiClient,
  OrderApiClient,
  EchoApiClient,
  ChatApiClient,
} from '../../api/clients';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Tất cả POMs của Neko project cho role context */
export type NekoPOMs = {
  productsPage: ProductsPage;
  ordersPage: OrdersPage;
  chatPage: ChatPage;
};

/** Tất cả API Clients & Services của Neko project cho role context */
export type NekoServices = {
  apiRequest: APIRequestContext;
  orderApi: OrderApiClient;
  productApi: ProductApiClient;
  chatApi: ChatApiClient;
  authApi: AuthApiClient;
  echoApi: EchoApiClient;
  // Aliases tương thích ngược:
  orderService: OrderApiClient;
  productService: ProductApiClient;
  chatService: ChatApiClient;
};

/** Full context cho 1 role — POMs + Services + raw page/token */
export type NekoRoleContext = NekoPOMs & NekoServices & {
  page: Page;
  token: string;
};

/** Neko-specific roles — match env vars NEKO_{ROLE}_USERNAME */
export type NekoRole = 'admin' | 'staff' | 'manager';

/** Signature: asRole('staff') → NekoRoleContext */
export type AsRoleFunction = (role: NekoRole) => Promise<NekoRoleContext>;

/** Export type cho merging vào unified.fixture.ts / hybrid-super-gatekeeper.fixture.ts */
export type RoleFixtures = {
  viewportType: ViewportType;
  asRole: AsRoleFunction;
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (INLINED)
// ═══════════════════════════════════════════════════════════════════════════

/** Tạo POMs cho 1 Page trong context của role */
export function createNekoPOMs(page: Page, viewport: ViewportType): NekoPOMs {
  return {
    productsPage: new ProductsPage(page, viewport),
    ordersPage: new OrdersPage(page, viewport),
    chatPage: new ChatPage(page, viewport),
  };
}

/** Tạo API Services từ token (isolated APIRequestContext) */
export async function createNekoServices(token: string): Promise<NekoServices> {
  const apiBaseUrl = EnvManager.get('NEKO_API_URL');
  const apiRequest = await playwrightRequest.newContext({
    baseURL: apiBaseUrl,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const orderApi = new OrderApiClient(apiRequest, token);
  const productApi = new ProductApiClient(apiRequest, token);
  const chatApi = new ChatApiClient(apiRequest, token);
  const authApi = new AuthApiClient(apiRequest, token);
  const echoApi = new EchoApiClient(apiRequest, token);

  return {
    apiRequest,
    orderApi,
    productApi,
    chatApi,
    authApi,
    echoApi,
    orderService: orderApi,
    productService: productApi,
    chatService: chatApi,
  };
}

/** Extract auth token từ storageState file cho 1 role */
export function extractTokenForRole(role: string): string {
  const state = nekoAuth.loadStorageState(role);
  if (!state) {
    throw new Error(
      `Storage state not found for role "${role}". ` +
      `Run neko-setup first or check .auth/neko-${role}.json exists.`
    );
  }

  const accessToken = getLocalStorageValue(state, 'access_token');
  if (accessToken) return accessToken;

  const nekoAuthValue = getLocalStorageValue(state, 'neko_auth');
  if (nekoAuthValue) {
    try {
      const parsed = JSON.parse(nekoAuthValue);
      const token = parsed.state?.accessToken;
      if (token) return token;
    } catch {
      // ignore parse errors
    }
  }

  throw new Error(
    `Could not extract token from storage state for role "${role}". ` +
    `Check .auth/neko-${role}.json format.`
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FIXTURE DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

export const roleFixtures = {
  viewportType: ['desktop' as ViewportType, { option: true }] as [ViewportType, { option: true }],

  /**
   * asRole — tạo isolated context cho 1 role.
   *
   * Flow:
   * 1. Check storageState file → nếu chưa có hoặc expired → LAZY LOGIN
   * 2. Load storageState → tạo isolated browser context
   * 3. Extract token → tạo API Services (via factory)
   * 4. Tạo POMs (via factory)
   * 5. Return NekoRoleContext { page, POMs, Services, token }
   *
   * 📌 LAZY LOGIN:
   * Setup chỉ login admin. Khi test gọi asRole('manager'),
   * fixture tự động login manager nếu chưa có storageState.
   *
   * Cleanup: close tất cả contexts + dispose API contexts khi test xong.
   */
  asRole: async (
    { browser, viewportType, request }: {
      browser: Browser;
      viewportType: ViewportType;
      request: APIRequestContext;
    },
    use: (fn: AsRoleFunction) => Promise<void>
  ) => {
    const contexts: BrowserContext[] = [];
    const apiContexts: APIRequestContext[] = [];

    const createRoleContext: AsRoleFunction = async (role) => {
      // ─── Lazy Login: tự login nếu chưa có storageState ────────────
      if (!nekoAuth.isStorageStateValid(role)) {
        Logger.info(`Storage state invalid for "${role}", logging in...`, { context: 'fixture' });
        await nekoAuth.loginAndSave(request, role);
        Logger.info(`Lazy login complete for "${role}"`, { context: 'fixture' });
      }

      const storagePath = nekoAuth.getStorageStatePath(role);
      Logger.info(`Loading role "${role}" from ${storagePath}`, { context: 'fixture' });

      // 1. Tạo isolated browser context với role's storageState
      const context = await browser.newContext({
        storageState: storagePath,
      });
      contexts.push(context);
      const page = await context.newPage();

      // 2. Tạo POMs (từ shared factory)
      const poms = createNekoPOMs(page, viewportType || 'desktop');

      // 3. Extract token + tạo API Services (từ shared factory)
      const token = extractTokenForRole(role);
      const services = await createNekoServices(token);
      apiContexts.push(services.apiRequest);

      Logger.info(`Role "${role}" ready — POMs + Services created`, { context: 'fixture' });

      return {
        page,
        token,
        ...poms,
        ...services,
      };
    };

    await use(createRoleContext);

    // 🧹 Cleanup
    Logger.info(`Cleaning up ${contexts.length} role contexts`, { context: 'fixture' });
    for (const ctx of contexts) {
      await ctx.close();
    }
    for (const apiCtx of apiContexts) {
      await apiCtx.dispose();
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TEST EXPORT (for standalone use)
// ═══════════════════════════════════════════════════════════════════════════

export const test = base.extend<RoleFixtures>(roleFixtures);
export { expect } from '@playwright/test';
