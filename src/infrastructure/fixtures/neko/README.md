# ☕ Neko Coffee Fixtures — Bài 24: Super Fixture Architecture

Thư mục này chứa toàn bộ hệ thống Fixture của **Neko Coffee**, được xây dựng theo chuẩn **Super Fixture (Bài 24)** kết hợp **Clean Architecture**.

---

## 🗺️ BẢN ĐỒ PHÂN LOẠI TỪNG FILE: FILE NÀO LÀ GÌ?

| Icon | Tên File | Phân Loại | Nhiệm Vụ & Dữ Liệu Cung Cấp |
| :---: | :--- | :---: | :--- |
| 🏆 | **`hybrid-super-gatekeeper.fixture.ts`** | **SUPER FIXTURE (CẢ HAI)** | **Trọng tâm Bài 24**: Hợp nhất cả 4 tầng (Auth + API + UI + Role) thành 1 `test` object duy nhất. |
| 📦 | **`index.ts`** | **BARREL EXPORT** | Cổng xuất khẩu chính. Cho phép mọi file test chỉ cần: `import { test, expect } from "@fixtures/neko"`. |
| 🖥️ | **`hybrid-app.fixture.ts`** | **THUẦN UI (POM)** | Cung cấp **6 Page Objects** giao diện Storefront & Admin:<br>• `productsPage`: Trang danh sách sản phẩm<br>• `ordersPage`: Trang đơn hàng của khách<br>• `adminProductsPage`: Bảng quản trị sản phẩm<br>• `adminOrdersPage`: Bảng quản trị đơn hàng<br>• `chatPage`: Phòng chat trực tuyến<br>• `loginPage`: Trang đăng nhập |
| 📡 | **`hybrid-services.fixture.ts`** | **THUẦN API (AOM)** | Cung cấp **API Clients & Services cấp cao**:<br>• `productService`, `orderService`, `chatService` (gắn sẵn token từ RAM)<br>• `productApi`, `orderApi`, `authApi`, `echoApi` (gọi HTTP thô) |
| ⚡ | **`hybrid-auth.fixture.ts`** | **AUTH / RAM SNAPSHOT (0ms)** | Quản lý xác thực tầng cao:<br>• `workerStaffSnapshot` & `workerAdminSnapshot` (**Worker Scope**): Lưu Token trong RAM CPU (0ms)<br>• Tiêm Token vào `localStorage` qua `context.addInitScript`<br>• `authedStaffClient` & `authedAdminClient`: Client có sẵn quyền tương ứng<br>• `adminPage`: Page được tiêm sẵn phiên Admin từ RAM (0ms) |
| 👥 | **`role.fixture.ts`** | **MULTI-ROLE (Đa người dùng)** | Cung cấp hàm `asRole('admin' \| 'staff' \| 'manager')` tự tạo Browser Context cô lập + POMs + Services độc lập cho từng vai trò (phục vụ test Chat realtime hoặc phân quyền). |
| 🔧 | **`neko.setup.ts`** | **SETUP PROJECT** | Playwright Setup Project để tạo file đĩa `.auth/neko-admin.json` (dự phòng qua `@auth`). |

> 📌 **Lưu ý Clean Architecture**: Các Class quản lý đăng nhập (`NekoAuthProvider`, `BaseAuthProvider`, `jwt.utils`) đã được chuyển về đúng tầng hạ tầng độc lập: [`src/infrastructure/auth/`](file:///e:/Khoa%20hoc/playwrigt-ts-framework-202603/src/infrastructure/auth) (`@auth`). Thư mục này chỉ chứa thuần túy các Playwright Fixtures!

---

## 🏗️ Sơ Đồ Khối Hợp Nhất (Super Fixture Pipeline)

```
┌────────────────────────────────────────────────────────────────────────┐
│               1. TẦNG XÁC THỰC WORKER RAM (0ms)                       │
│                     hybrid-auth.fixture.ts                             │
│       • workerStaffSnapshot & workerAdminSnapshot (RAM 0ms)           │
│       • context.addInitScript (In-Memory localStorage Injection)       │
│       • adminPage, authedStaffClient, authedAdminClient                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼                                                   ▼
┌───────────────────────────────┐   ┌──────────────────────────────────┐
│   2. TẦNG API THUẦN (AOM)     │   │     3. TẦNG UI THUẦN (POM)       │
│    hybrid-services.fixture.ts  │   │       hybrid-app.fixture.ts      │
│  • productService, authApi    │   │  • productsPage, ordersPage      │
│  • orderService, productApi   │   │  • adminProductsPage, chatPage   │
│  • chatService, echoApi       │   │  • adminOrdersPage, loginPage    │
└───────────────┬───────────────┘   └─────────────────┬────────────────┘
                │                                     │
                │        ┌────────────────────────────┘
                ▼        ▼
┌────────────────────────────────────────────────────────────────────────┐
│            4. SUPER GATEKEEPER — HỢP NHẤT TOÀN DIỆN                    │
│                 hybrid-super-gatekeeper.fixture.ts                     │
│    (Gộp: hybridAuth + hybridServices + hybridApp + roleFixtures)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ export ra ngoài
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           index.ts                                     │
│                import { test, expect } from "@fixtures/neko";          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 HƯỚNG DẪN SỬ DỤNG KHI VIẾT TEST

Mọi bài test chỉ cần **1 dòng import duy nhất**:
```typescript
import { test, expect } from "@fixtures/neko";
```

Playwright hoạt động theo cơ chế **Lazy Evaluation (Gọi gì nạp nấy)**:

### 1. Khi chỉ muốn test API thuần:
```typescript
test("Test API không bật trình duyệt", async ({ productService }) => {
  // Playwright CHỈ nạp HTTP Request Context & Service.
  // ❌ KHÔNG bật Browser DOM, 0ms lãng phí!
  const list = await productService.getProducts();
});
```

### 2. Khi chỉ muốn test UI thuần:
```typescript
test("Test giao diện UI", async ({ productsPage }) => {
  // Playwright bật Browser và nạp ProductsPage (POM).
  await productsPage.goto();
  await productsPage.expectOnPage();
});
```

### 3. Khi muốn test Super App / Hybrid E2E (Kết hợp cả hai):
```typescript
test("Hybrid E2E: API Seed -> UI Audit", async ({ productService, adminProductsPage }) => {
  // Nạp CẢ HAI: Dùng API tạo nhanh trong 100ms, dùng UI kiểm tra bảng.
  const product = await productService.createProduct({ name: "Cà phê Robusta" });
  await adminProductsPage.goto();
  await adminProductsPage.expectProductVisible(product.name);
});
```
