import {
  hybridAuth,
  type HybridAuthTestFixtures,
  type HybridAuthWorkerFixtures,
} from "./hybrid-auth.fixture";
import {
  hybridServicesFixtures,
  type HybridServicesFixtures,
} from "./hybrid-services.fixture";
import {
  hybridAppFixtures,
  type HybridAppFixtures,
} from "./hybrid-app.fixture";
import {
  roleFixtures,
  type RoleFixtures,
  type NekoRole,
  type AsRoleFunction,
} from "./role.fixture";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🛡️ HYBRID SUPER GATEKEEPER FIXTURE (HỢP NHẤT UI POM & API AOM & MULTI-ROLE)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Cổng điều phối tối cao (Single Entrypoint) hợp nhất 4 tầng kiến trúc chuẩn mực:
 * 1. Tầng Xác Thực Siêu Tốc (hybrid-auth.fixture.ts):
 *    - workerStaffSnapshot: Nạp và lưu trữ Token trong RAM của Worker tiến trình (0ms)
 *    - context.addInitScript: Tiêm Token vào localStorage của Trình duyệt (0ms)
 *    - authedStaffClient: API Client đã gắn sẵn token Staff từ RAM
 *
 * 2. Tầng API Services AOM (hybrid-services.fixture.ts):
 *    - authApi: AuthApiClient
 *    - productApi: ProductApiClient
 *    - echoApi: EchoApiClient
 *    - orderApi: OrderApiClient
 *
 * 3. Tầng UI Page Objects POM (hybrid-app.fixture.ts):
 *    - loginPage: NekoLoginPage
 *    - adminOrdersPage: NekoAdminOrdersPage
 *    - adminProductsPage: NekoAdminProductsPage
 *    - ordersPage: OrdersPage
 *    - productsPage: ProductsPage
 *    - chatPage: ChatPage
 *
 * 4. Tầng Multi-Role Testing (role.fixture.ts):
 *    - asRole('admin' | 'staff' | 'manager'): Isolated browser context + lazy login
 *
 * 🎯 100% Strict Type Safety — Mọi kịch bản chỉ cần import { test, expect } từ file này!
 */

// Re-export các kiểu dữ liệu cho spec và consumers
export type { NekoUserDto, WorkerStaffSnapshot, WorkerAdminSnapshot } from "./hybrid-auth.fixture";
export type {
  HybridAuthTestFixtures,
  HybridAuthWorkerFixtures,
} from "./hybrid-auth.fixture";
export type { HybridServicesFixtures } from "./hybrid-services.fixture";
export type { HybridAppFixtures } from "./hybrid-app.fixture";
export type { RoleFixtures, NekoRole, AsRoleFunction };

// Hợp nhất kiểu dữ liệu của toàn bộ Siêu App
export type HybridSuperTestFixtures = HybridAuthTestFixtures &
  HybridServicesFixtures &
  HybridAppFixtures &
  RoleFixtures;

export type HybridSuperWorkerFixtures = HybridAuthWorkerFixtures;

// Hợp nhất 4 tầng fixture vào test runner duy nhất
export const test = hybridAuth.extend<
  HybridSuperTestFixtures,
  HybridSuperWorkerFixtures
>({
  ...hybridServicesFixtures,
  ...hybridAppFixtures,
  ...roleFixtures,
});

export { expect } from "@playwright/test";
