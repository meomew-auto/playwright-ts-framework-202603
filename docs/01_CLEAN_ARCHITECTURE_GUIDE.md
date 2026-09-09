# 🏛️ CẨM NANG CLEAN ARCHITECTURE TRONG PLAYWRIGHT TYPESCRIPT

---

## 📑 MỤC LỤC
1. [Nguyên lý Clean Architecture trong Automation Testing](#1-nguyên-lý-clean-architecture-trong-automation-testing)
2. [Cấu trúc phân tầng: Infrastructure vs Presentation](#2-cấu-trúc-phân-tầng-infrastructure-vs-presentation)
3. [Tầng Hạ Tầng (Infrastructure Layer)](#3-tầng-hạ-tầng-infrastructure-layer)
4. [Tầng Trình Diễn (Presentation Layer)](#4-tầng-trình-diễn-presentation-layer)
5. [Hệ Thống Fixture Chaining & IoC Container](#5-hệ-thống-fixture-chaining--ioc-container)
6. [Quản Lý Môi Trường Đa Tầng (dotenv-flow + EnvManager)](#6-quản-lý-môi-trường-đa-tầng-dotenv-flow--envmanager)
7. [Bóc Tách Dữ Liệu Bảng Động (TableColumnHelpers)](#7-bóc-tách-dữ-liệu-bảng-động-tablecolumnhelpers)

---

## 1. Nguyên lý Clean Architecture trong Automation Testing

Trong các dự án kiểm thử tự động doanh nghiệp kéo dài nhiều năm, mã nguồn test thường gặp phải các vấn đề:
- **Spaghetti Code**: Trộn lẫn giữa thao tác click DOM, gọi API, xử lý chuỗi và kiểm tra assert trong cùng một file spec.
- **Flaky Tests**: Khi giao diện thay đổi chỉ một class hoặc đổi thứ tự cột trong bảng, hàng trăm bài test bị vỡ hàng loạt.
- **Khó mở rộng**: Muốn thêm một môi trường test (UAT, Staging) hay thêm một quyền người dùng (Editor, Staff, Manager) phải sửa đổi code ở hàng chục vị trí.

**Clean Architecture** giải quyết triệt để vấn đề này bằng cách:
1. **Phân tách trách nhiệm (Separation of Concerns)**: Test specs chỉ quan tâm đến **Kịch bản nghiệp vụ (WHAT to test)**, hoàn toàn không cần biết **Làm thế nào để tương tác (HOW to interact)**.
2. **Độc lập với giao diện và hạ tầng (Decoupling)**: Thay đổi selector DOM chỉ sửa ở Page Object Model; đổi cấu trúc API chỉ sửa ở API Client & Zod Schema.

---

## 2. Cấu trúc phân tầng: Infrastructure vs Presentation

```text
src/
├── infrastructure/               # TẦNG HẠ TẦNG (Kỹ thuật & Công cụ)
│   ├── api/                     # API Clients & Zod Runtime Schemas
│   ├── components/              # Các UI Component dùng lại (Sidebar, Nav, Modal)
│   ├── data/                    # Quản lý Test Data (JSON & Factories)
│   ├── fixtures/                # Dependency Injection (Playwright Fixtures)
│   ├── helpers/                 # TableColumnHelpers, WaitHelpers, Interception
│   ├── models/                  # TypeScript Data Types & Interfaces
│   ├── pages/                   # Page Object Models (BasePage, Orders, Products)
│   └── utils/                   # EnvManager, Winston Logger
│
└── presentation/                 # TẦNG TRÌNH DIỄN (Kịch bản kiểm thử)
    └── tests/
        ├── neko/                # Test suites Neko Coffee (Interception, Hybrid, API, UI)
        └── cms/                 # Test suites CMS (Desktop, Mobile)
```

---

## 3. Tầng Hạ Tầng (Infrastructure Layer)

### 3.1. API Object Model (AOM) & BaseApiClient
- Đóng gói `APIRequestContext` của Playwright.
- Tự động đính kèm `Authorization: Bearer <token>` nếu có token.
- Cung cấp 2 chế độ gọi:
  - **Raw HTTP Methods** (`get`, `post`, `put`, `delete`): Phục vụ kiểm tra status code, headers, lỗi 4xx/5xx.
  - **Smart Data Methods** (`getProductsData`, `loginData`): Tự động thẩm định qua **Zod Schema** bằng `parseResponse()`, trả về dữ liệu chuẩn kiểu TypeScript.

### 3.2. Page Object Model (POM) & BasePage
- Mọi POM đều kế thừa từ `BasePage`.
- Cung cấp helper `createLocatorGetter(locators)` giúp truy xuất locator kiểu type-safe kèm autocomplete.
- Tích hợp `clickWithLog` và `fillWithLog` tự động ghi nhận nhật ký thao tác vào Winston Logger.

---

## 4. Tầng Trình Diễn (Presentation Layer)

Tầng Presentation tổ chức các kịch bản test theo từng module chức năng và loại hình kiểm thử:
1. **`01-network-interception`**: Chuyên biệt kiểm tra phản ứng của Frontend với các tình huống mạng (Mocking, Abort, Rate limit, Delay).
2. **`02-hybrid-e2e`**: Kiểm thử tích hợp đa tầng theo mô hình bánh kẹp (API Seed ➔ UI Action ➔ API Verification).
3. **`03-api`**: Kiểm thử hợp đồng dữ liệu thuần túy qua API.
4. **`04-ui`**: Kiểm thử giao diện và tương tác người dùng thuần túy.

---

## 5. Hệ Thống Fixture Chaining & IoC Container

Playwright Fixtures đóng vai trò như một **Inversion of Control (IoC) Container**:
```text
hybrid-auth.fixture  ── (Worker RAM Snapshot + addInitScript)
         │
         ▼
hybrid-services.fixture ── (authApi, productApi, echoApi, orderApi)
         │
         ▼
hybrid-app.fixture ── (loginPage, adminOrdersPage, adminProductsPage)
         │
         ▼
role.fixture ── (asRole: admin, staff, manager, customer)
         │
         ▼
hybrid-super-gatekeeper.fixture ── (Single Entrypoint cho mọi Test!)
```

---

## 6. Quản Lý Môi Trường Đa Tầng (dotenv-flow + EnvManager)

Thứ tự ưu tiên nạp biến môi trường:
1. `process.env` (CLI command: `cross-env NODE_ENV=uat`)
2. `.env.uat.local` (Local secret, gitignored)
3. `.env.uat` (UAT URLs)
4. `.env.development` (Dev secrets)
5. `.env` (Default configuration)

`EnvManager.get('KEY')`: Tự động ném lỗi rõ ràng nếu biến môi trường bị thiếu, ngăn chặn tình trạng test chạy sai ngầm.

---

## 7. Bóc Tách Dữ Liệu Bảng Động (TableColumnHelpers)

```typescript
// Quét tiêu đề thẻ <th> tự động, không phụ thuộc vào thứ tự cột
const cache = await createColumnMap(tableHeaders);

// Lấy dòng đơn hàng theo mã đơn mà không hardcode index
const row = await findRowByColumnValueSimple(tableHeaders, tableRows, 'mãĐơn', '#B2C-123', customCleaners, cache);
```
Ưu điểm: Khi Frontend hoán đổi vị trí cột "Khách Hàng" và "Tổng Tiền", test script vẫn chạy chính xác 100% mà không cần sửa code!
