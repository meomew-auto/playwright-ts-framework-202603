# 🎭 Playwright TypeScript Framework (Clean Architecture & Hybrid Super App)

> **Khung kiểm thử tự động hóa chuẩn Enterprise** được xây dựng bằng **Playwright** và **TypeScript 100% Strict Type-Safe**.  
> Tích hợp toàn diện kiến thức chuyên sâu từ **Bài 24 (Network Interception, Mocking & Hybrid Testing Sandwich Model)** kết hợp với cấu trúc **Clean Architecture** phân tầng độc lập (CMS & Neko Coffee domains).

---

## 📑 MỤC LỤC TỔNG QUAN
1. [🌟 Tính Năng Nổi Bật & Tinh Hoa Kiến Trúc](#-tính-năng-nổi-bật--tinh-hoa-kiến-trúc)
2. [📁 Cấu Trúc Thư Mục Chuẩn Mực](#-cấu-trúc-thư-mục-chuẩn-mực)
3. [🚀 Hướng Dẫn Cài Đặt & Chạy Test](#-hướng-dẫn-cài-đặt--chạy-test)
4. [🥪 Mô Hình Hybrid Testing "Bánh Kẹp Sandwich"](#-mô-hình-hybrid-testing-bánh-kẹp-sandwich)
5. [🌐 Bộ Tứ Siêu Năng Lực Network Interception (Bài 24)](#-bộ-tứ-siêu-năng-lực-network-interception-bài-24)
6. [🔐 Ba Nấc Xác Thực Siêu Tốc (0ms Overhead)](#-ba-nấc-xác-thực-siêu-tốc-0ms-overhead)
7. [📊 Động Cơ Bóc Tách Bảng Động (TableColumnHelpers)](#-động-cơ-bóc-tách-bảng-động-tablecolumnhelpers)
8. [🛡️ Thẩm Định Hợp Đồng Thời Gian Thực (Zod Runtime Contracts)](#-thẩm-định-hợp-đồng-thời-gian-thực-zod-runtime-contracts)
9. [🌍 Quản Lý Đa Môi Trường (dotenv-flow + EnvManager)](#-quản-lý-đa-môi-trường-dotenv-flow--envmanager)
10. [📈 Báo Cáo Kiểm Thử (Allure Report & Playwright HTML)](#-báo-cáo-kiểm-thử-allure-report--playwright-html)

---

## 🌟 Tính Năng Nổi Bật & Tinh Hoa Kiến Trúc

- **Clean Architecture 2 Tầng Rành Mạch**:
  - `src/infrastructure/`: Đóng gói toàn bộ kỹ thuật (API Clients, Zod Schemas, POM Pages, Fixtures, Helpers, Utils).
  - `src/presentation/`: Chứa các bộ kịch bản kiểm thử độc lập, chia nhỏ theo mục đích (Interception, Hybrid E2E, Pure API, Pure UI, CMS).
- **Mô Hình Bánh Kẹp Sandwich (Hybrid E2E)**:
  - Chuẩn bị dữ liệu ban đầu qua API (< 150ms).
  - Thao tác trực diện trên UI tại màn hình mục tiêu (2s).
  - Hậu kiểm trực tiếp vào cơ sở dữ liệu qua API Zod Contract (< 300ms) và tự động dọn rác (Zero Pollution).
- **Xác Thực Đột Phá 0ms (Worker Scope RAM Snapshot & addInitScript)**:
  - Khởi tạo tài khoản Staff lưu trong RAM của Worker tiến trình.
  - Tiêm thẳng phiên đăng nhập vào `localStorage` của trình duyệt trước khi nạp trang, bỏ qua form Login truyền thống.
- **Multi-Role Context Switcher (`asRole`)**:
  - Hỗ trợ chạy đồng thời nhiều tài khoản (`admin`, `staff`, `manager`, `customer`) trong cùng một bài test với phiên độc lập (Isolated Sessions) và cơ chế **Lazy Login**.
- **Động Cơ Quét Bảng Tự Động (`TableColumnHelpers`)**:
  - Tự động xây dựng bản đồ cột (`ColumnMap`) từ thẻ `<th>`. Tuyệt đối không hardcode index cột (0, 1, 2) giúp chống vỡ test khi giao diện đổi thứ tự hiển thị.
- **Can Thiệp Mạng Đỉnh Cao (Network Interception)**:
  - `route.fulfill`: Mock dữ liệu 200, ép mã lỗi 401, 429 Retry-After, 500 Crash.
  - `route.abort`: Chặn tải ảnh và tracking script (GA, Sentry) giúp tăng tốc test 300%.
  - `route.fetch` + Tampering: Tráo đổi dữ liệu gói tin thật thành thẻ VIP Platinum 1 tỷ đồng.
  - `Latency Injection`: Bơm trễ mạng 2000ms kiểm thử loading spinner và chống spam click.

---

## 📁 Cấu Trúc Thư Mục Chuẩn Mực

```text
e:\Khoa hoc\playwrigt-ts-framework-202603\
├── .env                              # Cấu hình URLs mặc định
├── .env.development                  # Bí mật môi trường Dev
├── .env.uat / .env.uat.local         # Cấu hình môi trường UAT
├── playwright.config.ts              # Cấu hình trung tâm Playwright đa projects
├── tsconfig.json                     # Hệ thống Path Aliases (@fixtures, @pages, @clients...)
├── package.json                      # Bộ scripts chạy test linh hoạt
├── README.md                         # Cẩm nang kiến trúc tổng thể
│
├── docs/                             # TÀI LIỆU CHUYÊN SÂU
│   ├── 01_CLEAN_ARCHITECTURE_GUIDE.md
│   ├── 02_NETWORK_INTERCEPTION_DEEP_DIVE.md
│   └── 03_HYBRID_TESTING_SANDWICH_MODEL.md
│
├── src/
│   ├── infrastructure/               # TẦNG HẠ TẦNG (INFRASTRUCTURE LAYER)
│   │   ├── api/                      # TRỤ CỘT 1: GIAO TIẾP BACKEND (API CLIENTS & SCHEMAS)
│   │   │   ├── clients/              # BaseApiClient, AuthApiClient, ProductApiClient, EchoApiClient, OrderApiClient
│   │   │   ├── schemas/              # Zod Schemas (Auth, Product, Common, Order, Chat, Error)
│   │   │   └── services/             # BaseService, ProductService, OrderService, ChatService
│   │   │
│   │   ├── ui/                       # TRỤ CỘT 2: GIAO DIỆN NGƯỜI DÙNG (PAGES & COMPONENTS)
│   │   │   ├── pages/                # Page Object Models (BasePage, CMS Pages, Neko Coffee Pages)
│   │   │   │   ├── base/             # BasePage.ts, BaseTablePage.ts
│   │   │   │   ├── cms/              # CMS LoginPage, Dashboard, AllProducts, AddNewProduct
│   │   │   │   └── neko-coffee/      # NekoLoginPage, NekoAdminOrdersPage, NekoAdminProductsPage, ChatPage
│   │   │   └── components/           # UI Sub-Components (CMSSidebarMenu...)
│   │   │
│   │   ├── fixtures/                 # HỆ THỐNG DI & FIXTURES (IoC Container kết nối API + UI)
│   │   │   ├── common/               # ViewportType.ts, role.fixture.ts
│   │   │   ├── cms/                  # CMS Fixtures (auth, app, gatekeeper)
│   │   │   └── neko/                 # NEKO FIXTURES SIÊU CẤP:
│   │   │       ├── hybrid-auth.fixture.ts             # Worker RAM Snapshot & addInitScript (0ms)
│   │   │       ├── hybrid-services.fixture.ts         # AOM Clients Fixture (authApi, productApi, echoApi...)
│   │   │       ├── hybrid-app.fixture.ts              # POM Pages Fixture (loginPage, adminOrdersPage...)
│   │   │       ├── role.fixture.ts                    # asRole() Multi-Role Context
│   │   │       ├── hybrid-super-gatekeeper.fixture.ts # SINGLE ENTRYPOINT HỢP NHẤT TOÀN BỘ
│   │   │       └── unified.fixture.ts                 # Unified Entrypoint
│   │   ├── helpers/                  # BỘ TIỆN ÍCH CHUYÊN DỤNG (Table, Interception, Common)
│   │   │   ├── table/                # TableColumnHelpers.ts (Quét bảng tự động từ thẻ <th>)
│   │   │   ├── interception/         # NetworkInterceptionHelper.ts (Mock, Abort, Latency)
│   │   │   ├── common/               # WaitHelpers, CollectionHelper, TableResolver, FileResolverHelper
│   │   │   └── cms/                  # BootstrapSelectHelper
│   │   ├── data/                     # Quản lý Test Data (JSON & Data Factories, Assets)
│   │   └── utils/                    # EnvManager (typed getters), Logger (Winston)
│   │
│   └── presentation/                 # TẦNG KỊCH BẢN KIỂM THỬ (TEST SUITES)
│       └── tests/
│           ├── neko/
│           │   ├── 01-network-interception/           # 6 specs can thiệp mạng đỉnh cao (Bài 24)
│           │   │   ├── 01-mocking-and-route-fulfill.spec.ts
│           │   │   ├── 02-route-abort-and-modify.spec.ts
│           │   │   ├── 03-wait-for-response-and-ui-sync.spec.ts
│           │   │   ├── 04-login-screen-interception.spec.ts
│           │   │   ├── 05-har-recording-and-replay.spec.ts
│           │   │   └── 06-nextjs-route-mock-showroom.spec.ts
│           │   │
│           │   ├── 02-hybrid-e2e/                     # 3 specs kiểm thử lai Sandwich Model
│           │   │   ├── 01-auth-mechanisms-proof.spec.ts
│           │   │   ├── 02-sandwich-workflow-e2e.spec.ts
│           │   │   └── 03-realworld-ecommerce-workflows.spec.ts
│           │   │
│           │   ├── 03-api/                            # Pure API Testing (CRUD, Zod Validation)
│           │   │   ├── products-crud.spec.ts
│           │   │   └── auth-flow.spec.ts
│           │   │
│           │   └── 04-ui/                             # Pure UI Testing (Bảng Orders, Chat đa vai trò)
│           │       ├── orders-table.spec.ts
│           │       ├── chat-realtime.spec.ts
│           │       └── products-list.spec.ts
│           │
│           └── cms/                                   # CMS Regression Tests (Desktop & Mobile)
│               ├── auth/ui/login.spec.ts
│               └── products/ui/
│                   ├── create.write.spec.ts
│                   ├── list.read.spec.ts
│                   ├── manage.write.spec.ts
│                   └── list.mobile.spec.ts
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Test

### 1. Cài đặt thư viện
```bash
npm install
npx playwright install chromium
```

### 2. Kiểm tra biên dịch TypeScript (Type Check)
```bash
npm run typecheck
```

### 3. Chạy các Test Suites theo mục đích

#### 🌐 Tầng Network Interception (Bài 24):
```bash
npm run test:neko:network
```

#### 🥪 Tầng Hybrid E2E Sandwich Model:
```bash
npm run test:neko:hybrid
```

#### 🐱 Tầng Pure API Testing:
```bash
npm run test:neko:api
```

#### 🐱 Tầng Pure UI Testing:
```bash
npm run test:neko:ui
```

#### 🌟 Chạy toàn bộ Neko Coffee Suites:
```bash
npm run test:neko:all
```

#### 🖥️ Chạy bộ CMS Regression:
```bash
npm run test:cms           # Desktop
npm run test:cms:mobile    # Mobile viewport (iPhone 12)
```

#### 📊 Xem Báo Cáo Kiểm Thử:
```bash
npm run report             # Playwright HTML Report
npm run allure:open        # Allure Report
```

---

## 🥪 Mô Hình Hybrid Testing "Bánh Kẹp Sandwich"

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 🍞 LỚP 1: FAST API SEED (< 150ms)                                      │
│    Tạo sản phẩm / đơn hàng qua API Client                              │
├────────────────────────────────────────────────────────────────────────┤
│ 🥩 LỚP 2: TARGETED UI ACTION (~ 2s)                                    │
│    Mở thẳng màn hình mục tiêu với Token tiêm sẵn (addInitScript)       │
│    Thao tác duyệt đơn, đổi trạng thái trên bảng UI                     │
├────────────────────────────────────────────────────────────────────────┤
│ 🍞 LỚP 3: API DB AUDIT & TEARDOWN (< 300ms)                            │
│    Query ngầm Database qua API Zod Contract để chống "Pass ảo"         │
│    Tự động dọn dẹp sạch sẽ (Zero Pollution)                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🌐 Bộ Tứ Siêu Năng Lực Network Interception (Bài 24)

1. **`route.fulfill()`**: Giả lập dữ liệu thành công (200 OK), dữ liệu rỗng, hoặc ép mã lỗi máy chủ (500), lỗi Rate Limit (429 Retry-After).
2. **`route.abort()`**: Chặn hình ảnh nặng và tracking script bên thứ ba, tăng tốc độ chạy test lên 300%.
3. **`route.continue()`**: Tiêm Header tùy biến (`X-Feature-Flag`, `Authorization`) vào request đang bay đi.
4. **`route.fetch()` + Tampering**: Bắt gói tin thật từ Backend, tráo đổi dữ liệu người dùng thành Thẻ VIP Platinum số dư 1 tỷ đồng.
5. **`waitForResponse()` ("Giăng lưới trước - Ném đá sau")**: Đón bắt gói tin mạng chính xác bằng `Promise.all([page.waitForResponse(...), action])`.

---

## 🔐 Ba Nấc Xác Thực Siêu Tốc (0ms Overhead)

1. **Nấc 1 (File Đĩa .auth/)**: Project Dependencies truyền thống qua `neko.setup.ts`.
2. **Nấc 2 (Worker Scope RAM Snapshot - 0ms)**: Tạo tài khoản Staff trong RAM của từng Worker tiến trình qua `hybrid-auth.fixture.ts`.
3. **Nấc 3 (Dynamic In-Memory Injection - `addInitScript`)**: Tiêm thẳng token và trạng thái Zustand (`neko_auth`) vào `localStorage` của trình duyệt trước khi nạp trang. Không tốn thời gian thao tác form Login!

---

## 📊 Động Cơ Bóc Tách Bảng Động (TableColumnHelpers)

```typescript
import { test, expect } from '@fixtures/neko/hybrid-super-gatekeeper.fixture';

test('Kiểm tra bảng đơn hàng', async ({ adminOrdersPage }) => {
  await adminOrdersPage.navigate();
  
  // Tự động tìm dòng theo mã đơn dựa trên thẻ <th>
  const row = await adminOrdersPage.findOrderRowByCode('#B2C-20260210-4528');
  await expect(row).toBeVisible();

  // Bóc tách dữ liệu sạch thành Object
  const data = await adminOrdersPage.getOrderRowData('#B2C-20260210-4528');
  expect(data['trạngThái']).toBe('Đã giao hàng');
  expect(data['tổngTiền']).toBe('380.000đ');
});
```

---

## 🛡️ Thẩm Định Hợp Đồng Thời Gian Thực (Zod Runtime Contracts)

Mọi API Client kế thừa từ `BaseApiClient` đều tích hợp cơ chế `parseResponse(response, schema)`:
- Tự động kiểm tra tính toàn vẹn của dữ liệu trả về từ máy chủ.
- Báo lỗi ngay lập tức nếu Backend thay đổi kiểu dữ liệu hoặc thiếu trường bắt buộc (Schema Drift).

---

## 📦 Hệ Thống Path Aliases Chuẩn Mực

```typescript
import { test, expect } from '@fixtures/neko/hybrid-super-gatekeeper.fixture';
import { AuthApiClient, ProductApiClient } from '@clients';
import { productDtoSchema } from '@schemas/neko';
import { NekoAdminOrdersPage } from '@pages/neko/NekoAdminOrdersPage';
import { TableColumnHelpers } from '@helpers/common/table/TableColumnHelpers';
import { EnvManager } from '@utils/EnvManager';
import { Logger } from '@utils/Logger';
```

---

## 👥 Đóng Góp & Bảo Trì

Mọi thắc mắc và tài liệu chi tiết vui lòng xem tại thư mục [`docs/`](./docs/):
- [`docs/01_CLEAN_ARCHITECTURE_GUIDE.md`](./docs/01_CLEAN_ARCHITECTURE_GUIDE.md): Nguyên lý Clean Architecture & IoC Fixtures.
- [`docs/02_NETWORK_INTERCEPTION_DEEP_DIVE.md`](./docs/02_NETWORK_INTERCEPTION_DEEP_DIVE.md): Cẩm nang can thiệp mạng CDP Level.
- [`docs/03_HYBRID_TESTING_SANDWICH_MODEL.md`](./docs/03_HYBRID_TESTING_SANDWICH_MODEL.md): Mô hình bánh kẹp & 3 Nấc xác thực.
