# 🛒 CMS eCommerce Fixtures — Super Fixture & Worker Scope RAM Snapshot Architecture

Thư mục này chứa toàn bộ hệ thống Fixture của **CMS eCommerce**, được xây dựng theo chuẩn **Super Fixture (Bài 24)** kết hợp **Worker Scope RAM Snapshot**.

---

## 🗺️ BẢN ĐỒ PHÂN LOẠI TỪNG FILE

| Icon | Tên File | Phân Loại | Nhiệm Vụ & Dữ Liệu Cung Cấp |
| :---: | :--- | :---: | :--- |
| 🏆 | **`cms-super-gatekeeper.fixture.ts`** | **SUPER FIXTURE** | **Trọng tâm Bài 24**: Hợp nhất Auth + Page Objects thành 1 `test` object duy nhất. |
| 📦 | **`index.ts`** | **BARREL EXPORT** | Cổng xuất khẩu chính. Cho phép mọi file test chỉ cần: `import { test, expect } from "@fixtures/cms"`. |
| ⚡ | **`cms-auth.fixture.ts`** | **AUTH / RAM SNAPSHOT (0ms)** | Quản lý xác thực tầng cao:<br>• `workerCmsAdminSnapshot` (**Worker Scope**): Lưu trữ Session Cookies trong RAM CPU (0ms)<br>• Tự động tiêm Cookies vào Browser Context bằng `context.addCookies`<br>• `authedPage`: Page có sẵn phiên đăng nhập từ RAM<br>• `guestContext` & `guestPage`: Phiên khách vãng lai độc lập sạch 100% không cookie<br>• `loginPage` & `guestLoginPage`: POM gắn với `guestPage` sạch bóng |
| 🖥️ | **`cms-app.fixture.ts`** | **THUẦN UI (POM)** | Cung cấp **Page Objects** quản trị eCommerce:<br>• `dashboardPage`: Bảng điều khiển Admin<br>• `allProductsPage`: Danh sách sản phẩm Footable<br>• `addNewProductPage`: Form tạo sản phẩm mới |
| 🔧 | **`auth.setup.ts`** | **SETUP PROJECT** | Playwright Setup Project để tạo file đĩa `.auth/cms-admin.json` (dự phòng qua `@auth`). |

---

## 🏗️ Sơ Đồ Khối Hợp Nhất (Super Fixture Pipeline)

```
┌────────────────────────────────────────────────────────────────────────┐
│               1. TẦNG XÁC THỰC WORKER RAM (0ms)                       │
│                       cms-auth.fixture.ts                              │
│       • workerCmsAdminSnapshot ({ scope: 'worker' }) (RAM 0ms)        │
│       • context.addCookies (In-Memory Cookie Session Injection)        │
│       • authedPage, loginPage, viewportType                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     2. TẦNG UI THUẦN (POM)                             │
│                         cms-app.fixture.ts                             │
│       • dashboardPage, allProductsPage, addNewProductPage              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│            3. SUPER GATEKEEPER — HỢP NHẤT TOÀN DIỆN                    │
│                 cms-super-gatekeeper.fixture.ts                        │
│             (Gộp: cmsAuth.extend({ ...cmsAppFixtures }))               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ export ra ngoài
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           index.ts                                     │
│                import { test, expect } from "@fixtures/cms";           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 HƯỚNG DẪN SỬ DỤNG KHI VIẾT TEST

Mọi bài test CMS chỉ cần **1 dòng import duy nhất**:
```typescript
import { test, expect } from "@fixtures/cms";
```

### 1. Test xem danh sách sản phẩm (POM tự động tiêm Cookie từ RAM):
```typescript
test("Xem danh sách sản phẩm", async ({ allProductsPage }) => {
  // allProductsPage đã có sẵn cookie đăng nhập từ RAM CPU (0ms)
  await allProductsPage.goto();
  await allProductsPage.expectOnPage();
});
```

### 2. Test luồng tạo sản phẩm:
```typescript
test("Tạo sản phẩm mới", async ({ addNewProductPage, allProductsPage }) => {
  await addNewProductPage.goto();
  await addNewProductPage.fillProductInformation({ name: "Sản phẩm mới" });
  await addNewProductPage.saveProduct();
  await allProductsPage.expectProductExists("Sản phẩm mới");
});
```
