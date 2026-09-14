import { test as base, Page } from "@playwright/test";
import { NekoLoginPage } from "@pages/neko/NekoLoginPage";
import { NekoAdminOrdersPage } from "@pages/neko/NekoAdminOrdersPage";
import { NekoAdminProductsPage } from "@pages/neko/NekoAdminProductsPage";
import { OrdersPage } from "@pages/neko/OrdersPage";
import { ProductsPage } from "@pages/neko/ProductsPage";
import { ChatPage } from "@pages/neko/ChatPage";
import { NekoHeaderNavigationPage } from "@pages/neko/NekoHeaderNavigationPage";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🖥️ TẦNG UI PAGE OBJECTS FIXTURE (POM - PAGE OBJECT MODEL)
 * ════════════════════════════════════════════════════════════════════════════
 * Cung cấp các Page Object Models cho giao diện Neko Coffee:
 * 1. loginPage: Trang đăng nhập người dùng (Next.js Form, Error alerts, Spinner)
 * 2. adminOrdersPage: Trang quản lý danh sách đơn hàng Admin (TableColumnHelpers)
 * 3. adminProductsPage: Trang quản lý danh sách sản phẩm Admin
 * 4. ordersPage: Trang quản lý đơn hàng theo TableResolver & CollectionHelper
 * 5. productsPage: Trang sản phẩm
 * 6. chatPage: Trang chat realtime đa tài khoản
 * 7. headerNavPage: Thanh điều hướng Header Responsive (Desktop vs Mobile)
 */

export interface HybridAppFixtures {
  loginPage: NekoLoginPage;
  guestLoginPage: NekoLoginPage;
  adminOrdersPage: NekoAdminOrdersPage;
  adminProductsPage: NekoAdminProductsPage;
  ordersPage: OrdersPage;
  productsPage: ProductsPage;
  chatPage: ChatPage;
  headerNavPage: NekoHeaderNavigationPage;
}

export const hybridAppFixtures = {
  loginPage: async (
    { guestPage, page }: { guestPage?: Page; page: Page },
    use: (r: NekoLoginPage) => Promise<void>,
  ) => {
    // Ưu tiên sử dụng guestPage sạch bóng để không bị auto-redirect do Staff Token
    await use(new NekoLoginPage(guestPage || page));
  },
  guestLoginPage: async (
    { guestPage, page }: { guestPage?: Page; page: Page },
    use: (r: NekoLoginPage) => Promise<void>,
  ) => {
    await use(new NekoLoginPage(guestPage || page));
  },
  adminOrdersPage: async (
    { page }: { page: Page },
    use: (r: NekoAdminOrdersPage) => Promise<void>,
  ) => {
    await use(new NekoAdminOrdersPage(page));
  },
  adminProductsPage: async (
    { page }: { page: Page },
    use: (r: NekoAdminProductsPage) => Promise<void>,
  ) => {
    await use(new NekoAdminProductsPage(page));
  },
  ordersPage: async (
    { page }: { page: Page },
    use: (r: OrdersPage) => Promise<void>,
  ) => {
    await use(new OrdersPage(page));
  },
  productsPage: async (
    { page }: { page: Page },
    use: (r: ProductsPage) => Promise<void>,
  ) => {
    await use(new ProductsPage(page));
  },
  chatPage: async (
    { page }: { page: Page },
    use: (r: ChatPage) => Promise<void>,
  ) => {
    await use(new ChatPage(page));
  },
  headerNavPage: async (
    { guestPage, page }: { guestPage?: Page; page: Page },
    use: (r: NekoHeaderNavigationPage) => Promise<void>,
  ) => {
    await use(new NekoHeaderNavigationPage(guestPage || page));
  },
};

export const hybridApp = base.extend<HybridAppFixtures>(hybridAppFixtures);
