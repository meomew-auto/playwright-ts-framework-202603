---
name: playwright-test-crafting
description: >-
  Enterprise playbook for discovering UI locators, authoring Page Object Models (POM) with Locator Map and TableColumnHelpers,
  architecting 3-tier API Object Models (AOM), and crafting 5 enterprise Hybrid API + UI E2E testing models using Super Fixtures.
---

# 🎭 Playwright Test Crafting Playbook (Core Standard)

Quy chuẩn kỹ thuật bắt buộc cho AI Agent khi thiết kế Page Object Model (POM), API Object Model (AOM), và xây dựng các kịch bản kiểm thử E2E / Hybrid trong toàn bộ framework đa miền (Multi-Domain).

---

## 1. Nguyên Tắc Định Nghĩa Locators: Locator Map Pattern

Trong toàn bộ framework, **TUYỆT ĐỐI KHÔNG** khai báo biến locator lẻ tẻ trong `constructor`. 

Tất cả Page Objects **BẮT BUỘC** sử dụng **`pageLocators` dictionary** kết hợp với `createLocatorGetter` của `BasePage`:

```typescript
private readonly pageLocators = {
  // 1. Semantic Accessibility (Ưu tiên số 1): getByRole, getByLabel, getByPlaceholder
  pageHeading: (page: Page) => page.getByRole("heading", { name: "Dashboard" }),
  searchInput: (page: Page) => page.getByPlaceholder("Search..."),
  actionBtn: (page: Page) => page.getByRole("button", { name: "Submit" }),

  // 2. Component Containers & Tables
  tableContainer: (page: Page) => page.locator(".data-table, table").first(),
  tableHeaders: (page: Page) => page.locator("table thead th"),
  tableRows: (page: Page) => page.locator("table tbody tr"),

  // 3. Dynamic Locators (Nhận tham số động thời điểm runtime)
  rowByCode: (page: Page, code: string) =>
    page.locator(`tr:has-text("${code}")`),
  buttonByRow: (page: Page, row: Locator, btnName: string) =>
    row.getByRole("button", { name: btnName }),
};

// Tự động sinh getter type-safe hỗ trợ autocompletion
public element = this.createLocatorGetter(this.pageLocators);
```

### 1.1. Responsive Locators (Desktop vs Mobile) - Inline Colocated Ternary Pattern

Khi một thành phần giao diện có cấu trúc khác biệt giữa Desktop và Mobile (ví dụ: thanh menu Desktop vs Drawer Hamburger Mobile):

> [!WARNING]
> **TUYỆT ĐỐI KHÔNG DÙNG `locator.or()` CHO RESPONSIVE CSS/TAILWIND!**
> Trên hầu hết web hiện đại (Tailwind, Bootstrap), cả 2 element Desktop và Mobile đều **cùng tồn tại trong DOM** (chỉ ẩn/hiện bằng class CSS như `hidden lg:flex` và `lg:hidden`).
> Khi gọi `locator(desktop).or(locator(mobile)).click()`, Playwright sẽ tìm thấy cả 2 nodes trong DOM và **CRASH ngay lập tức vì Strict Mode Violation (`resolved to 2 elements`)**!

#### ✅ Chuẩn mực bắt buộc: Inline Colocated Ternary với `this.isMobile()`
Khai báo nhánh rẽ trực tiếp trong từng Arrow Function của `pageLocators`:

```typescript
export class NekoHeaderPage extends BasePage {
  private readonly pageLocators = {
    // 🎯 Co-located: Cả 2 selector nằm cạnh nhau, 100% type-safe, không sợ lệch key
    menuTrigger: (page: Page) =>
      this.isMobile()
        ? page.getByTestId("header-button-mobile-menu")
        : page.locator("header button.lg\\:relative"),

    orderTrackingLink: (page: Page) =>
      this.isMobile()
        ? page.locator("aside a, div[role='dialog'] a, .space-y-1 a").filter({ hasText: "Tra cứu đơn" })
        : page.getByTestId("header-nav-order-tracking"),
  };

  public element = this.createLocatorGetter(this.pageLocators);

  // 🎯 Action method phẳng tuyệt đối, chỉ gọi semantic element
  async clickMenuTrigger(): Promise<void> {
    await this.clickWithLog(this.element("menuTrigger"));
  }

  // 🎯 Điều phối luồng hành động chuẩn (mở drawer trên mobile trước khi click link)
  async goToOrderTracking(): Promise<void> {
    if (this.isMobile()) {
      await this.clickMenuTrigger();
    }
    await this.clickWithLog(this.element("orderTrackingLink"));
    await this.page.waitForURL("**/order-tracking");
  }
}
```

#### 💡 Cơ chế cốt lõi:
1. **Lexical `this` Binding**: Mọi selector trong `pageLocators` là Arrow Function `(page: Page) => ...`, tự động khóa và thừa hưởng con trỏ `this` của class `BasePage`.
2. **Deterministic Evaluation**: Khi chạy trên Desktop, chỉ đúng nhánh Desktop được evaluate; khi chạy trên Mobile, chỉ đúng nhánh Mobile được evaluate ➔ **0 lỗi Strict Mode**.
3. **Auto-Detection**: `BasePage.isMobile()` tự động nhận diện cả fixture `viewportType: 'mobile'` lẫn kích thước trình duyệt thực tế qua `page.viewportSize()?.width < 1024`.

---

## 2. Quy Chuẩn Thiết Kế Page Object Model (POM)

Mọi POM phải kế thừa `BasePage` (`src/infrastructure/ui/pages/base/BasePage.ts`).

### A. Template POM Bảng Dữ Liệu (Table / Grid POM)
Khi trang có bảng dữ liệu (`<table>`, DataGrid), **BẮT BUỘC** tích hợp `TableColumnHelpers` để tự động ánh xạ header, không bao giờ hardcode chỉ số cột (`td[2]`):

```typescript
import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base/BasePage";
import { EnvManager } from "@utils/EnvManager";
import {
  ColumnMap,
  createColumnMap,
  ColumnTextCleaner,
  findRowByColumnValueSimple,
  getRowDataByFiltersSimple,
  getTableDataSimple,
} from "@helpers/common/table/TableColumnHelpers";

export const DEFAULT_COLUMNS: string[] = ["code", "title", "status", "createdDate"];

export class GenericTablePage extends BasePage {
  // 1. Cache bản đồ cột động
  private columnMapCache: ColumnMap | null = null;

  // 2. Locator Map tập trung
  private readonly pageLocators = {
    pageHeading: (page: Page) => page.getByRole("heading", { name: "Manage Items" }),
    searchInput: (page: Page) => page.getByPlaceholder("Filter items..."),
    tableContainer: (page: Page) => page.locator(".data-table, table").first(),
    tableHeaders: (page: Page) => page.locator("table thead th"),
    tableRows: (page: Page) => page.locator("table tbody tr"),
  };

  public element = this.createLocatorGetter(this.pageLocators);

  // 3. Text Cleaners xử lý bóc tách text chuẩn hóa (xóa icon, bullet, khoảng trắng)
  private readonly customCleaners: Record<string, ColumnTextCleaner> = {
    status: async (cell: Locator) => (await cell.innerText()).replace(/[•\n]/g, "").trim(),
    title: async (cell: Locator) => (await cell.innerText()).trim(),
  };

  constructor(page: Page) {
    super(page);
  }

  // 4. Khởi tạo / Cache bản đồ cột tự động từ thẻ <th>
  private async getColumnMap(): Promise<ColumnMap> {
    if (!this.columnMapCache) {
      this.columnMapCache = await createColumnMap(this.element("tableHeaders"), DEFAULT_COLUMNS);
    }
    return this.columnMapCache;
  }

  // 5. Navigation và Thẩm định nạp trang
  async navigate(url?: string): Promise<void> {
    const targetUrl = url || `${EnvManager.get("APP_UI_URL")}/items`;
    await this.navigateTo(targetUrl);
    await this.expectOnPage();
  }

  async expectOnPage(): Promise<void> {
    await expect(this.element("tableContainer")).toBeVisible({ timeout: 10000 });
  }

  // 6. Action Methods (Sử dụng fillWithLog và clickWithLog của BasePage)
  async searchItem(keyword: string): Promise<void> {
    await this.fillWithLog(this.element("searchInput"), keyword, "Search Input");
    await this.page.keyboard.press("Enter");
  }

  // 7. Verification Methods qua TableColumnHelpers
  async expectItemExists(code: string): Promise<void> {
    const columnMap = await this.getColumnMap();
    const row = await findRowByColumnValueSimple(this.element("tableRows"), columnMap, "code", code);
    expect(row, `Không tìm thấy dòng có mã [${code}]`).not.toBeNull();
    await expect(row!).toBeVisible();
  }
}
```

---

## 3. Quy Chuẩn API Object Model (AOM 3 Tầng)

Để mọi Domain (`<domain>`) đều có thể tương tác API một cách độc lập và mạnh mẽ, kiến trúc API được tổ chức thành 3 tầng:

```
src/infrastructure/api/
├── clients/<domain>/               # Tầng 1: HTTP Transport thô (nhận APIRequestContext)
├── services/<domain>/              # Tầng 2: Nghiệp vụ cấp cao (Business Workflow & Error Handling)
└── schemas/<domain>/               # Tầng 3: Zod Contracts & Payload Factories
```

### 3.1. Tầng 1: Clients (`api/clients/<domain>/`)
- Chuyên trách gọi HTTP thô (`GET, POST, PUT, DELETE, PATCH`) thông qua `APIRequestContext` của Playwright.
- Nhận URL và options, trả về `Promise<APIResponse>`. Không can thiệp vào logic ném lỗi nghiệp vụ.
```typescript
import { APIRequestContext, APIResponse } from "@playwright/test";

export class OrderApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly token?: string,
  ) {}

  async create(payload: unknown): Promise<APIResponse> {
    return this.request.post("/api/v1/orders", {
      data: payload,
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
  }

  async getById(id: string | number): Promise<APIResponse> {
    return this.request.get(`/api/v1/orders/${id}`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
  }

  async delete(id: string | number): Promise<APIResponse> {
    return this.request.delete(`/api/v1/orders/${id}`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
  }
}
```

### 3.2. Tầng 2: Services (`api/services/<domain>/`)
- Chuyên trách logic nghiệp vụ cấp cao: tự động kiểm tra `res.ok()`, ném `Error` chi tiết nếu thất bại, parse JSON và validate qua Zod Schema.
```typescript
import { OrderApiClient } from "../clients/OrderApiClient";
import { orderDtoSchema, type OrderDto } from "../schemas/OrderSchemas";

export class OrderService {
  constructor(private readonly client: OrderApiClient) {}

  async createOrder(payload: unknown): Promise<OrderDto> {
    const res = await this.client.create(payload);
    if (!res.ok()) {
      const errText = await res.text().catch(() => "(no body)");
      throw new Error(`[OrderService] Tạo đơn hàng thất bại (${res.status()}): ${errText}`);
    }
    const data = await res.json();
    return orderDtoSchema.parse(data);
  }

  async deleteOrder(id: string | number): Promise<void> {
    const res = await this.client.delete(id);
    if (!res.ok()) {
      throw new Error(`[OrderService] Xóa đơn hàng [${id}] thất bại (${res.status()})`);
    }
  }
}
```

### 3.3. Tầng 3: Schemas & Factories (`api/schemas/<domain>/`)
- Định nghĩa Zod Schema bảo vệ tính toàn vẹn hợp đồng API ở thời điểm runtime.
- Cung cấp hàm Factory sinh dữ liệu mẫu với timestamp duy nhất (`Date.now()`).
```typescript
import { z } from "zod";

export const orderDtoSchema = z.object({
  id: z.number(),
  orderCode: z.string(),
  totalAmount: z.number(),
  status: z.string(),
});

export type OrderDto = z.infer<typeof orderDtoSchema>;

export class OrderSchemas {
  static createPayload(overrides?: Record<string, unknown>) {
    const unique = Date.now();
    return {
      orderCode: `ORD_${unique}`,
      totalAmount: 150000,
      status: "pending",
      ...overrides,
    };
  }
}
```

---

## 4. Bộ 5 Mô Hình Hybrid E2E Doanh Nghiệp (Super Fixture Dual-Engine)

Trong các bài test thực tế, **UI và API phối hợp nhịp nhàng trong cùng một test case** thông qua Super Fixture (`@fixtures/<domain>`).

### Mô Hình 1: Fast-Forward API Seeding ➔ UI Action
> **Mục đích**: Tiết kiệm 90% thời gian thực thi. Thay vì phải click 15 bước qua các form UI để tạo dữ liệu ban đầu, ta gọi API Service tạo data trong 100ms, rồi mở thẳng UI để kiểm thử tính năng chính.

```typescript
test("Khách hàng thanh toán đơn hàng đã tạo trước", async ({
  orderService,       // Tầng API Service
  checkoutPage,       // Tầng UI POM
}) => {
  // 1. Fast Seeding qua API trong 100ms
  const seedPayload = OrderSchemas.createPayload({ status: "pending" });
  const createdOrder = await orderService.createOrder(seedPayload);

  // 2. Mở thẳng trang Checkout trên UI bằng ID vừa tạo
  await checkoutPage.navigate(createdOrder.id);
  await checkoutPage.completePayment("VNPAY");
  await checkoutPage.expectPaymentSuccess();
});
```

---

### Mô Hình 2: UI Action ➔ API Database Integrity Check (Chống "Optimistic UI")
> **Mục đích**: Frontend hiện đại (React/Next.js/Vue) thường dùng kỹ thuật *Optimistic UI* (tự cập nhật giao diện trước khi server phản hồi). Nếu chỉ assert UI, bài test vẫn xanh dù Backend rollback database! Do đó, sau thao tác UI, bắt buộc gọi API Backend đối soát sâu vào DB.

```typescript
test("Hủy đơn hàng trên UI và đối soát tính toàn vẹn Database qua API", async ({
  adminOrdersPage,    // UI POM
  orderService,       // API Service
}) => {
  const targetCode = "ORD_202603_999";

  // 1. Thao tác trên UI
  await adminOrdersPage.navigate();
  await adminOrdersPage.cancelOrder(targetCode);
  await adminOrdersPage.expectStatus(targetCode, "Cancelled");

  // 2. HẬU KIỂM API: Truy vấn trực tiếp Backend để xác nhận Database đã lưu chuẩn
  const dbRecord = await orderService.getOrderByCode(targetCode);
  expect(dbRecord.status).toBe("CANCELLED");
});
```

---

### Mô Hình 3: Dual-Role Parallel Collaboration (Staff API + Guest UI)
> **Mục đích**: Kiểm thử đa vai trò trong cùng 1 kịch bản. Super Fixture cung cấp song song:
> - `authedStaffClient`: Phiên nhân viên/quản trị viên (được nạp sẵn token qua RAM Snapshot).
> - `guestPage`: Trình duyệt khách vãng lai sạch 100% (Zero Auth), không dính token hay session của Staff.

```typescript
test("Staff cập nhật trạng thái đơn hàng qua API ➔ Khách tra cứu thời gian thực trên UI", async ({
  authedStaffClient,    // Phiên Admin/Staff qua API
  guestPage,            // Trình duyệt khách sạch bóng 100%
}) => {
  const orderCode = "ORD_DUAL_2026";

  // 1. Staff duyệt đơn hàng qua API
  const updateRes = await authedStaffClient.orderApi.updateStatus(orderCode, "DELIVERED");
  expect(updateRes.ok()).toBe(true);

  // 2. Khách vãng lai mở trang tra cứu trên guestPage
  const trackingPage = new GenericTrackingPage(guestPage);
  await trackingPage.navigate();
  await trackingPage.track(orderCode);
  await trackingPage.expectStatus("Đã giao hàng");
});
```

---

### Mô Hình 4: Reverse Network Audit & Zod Contract Validation
> **Mục đích**: Thao tác giao diện UI và đồng thời đón bắt gói tin API do frontend gửi ngầm. Sử dụng Zod Schema để validate toàn vẹn cấu trúc dữ liệu trả về theo thời gian thực.

```typescript
test("Bấm lọc đơn hàng và kiểm định hợp đồng Zod API phản hồi", async ({
  page,
  adminOrdersPage,
}) => {
  await adminOrdersPage.navigate();

  // Đón bắt gói tin mạng được kích hoạt bởi thao tác UI
  const [response] = await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/orders") && res.status() === 200),
    adminOrdersPage.filterByKeyword("Special"),
  ]);

  // Thẩm định hợp đồng dữ liệu qua Zod
  const jsonBody = await response.json();
  const parsedData = orderDtoSchema.array().parse(jsonBody.data);
  expect(parsedData.length).toBeGreaterThan(0);
});
```

---

### Mô Hình 5: Zero-Pollution Auto-Teardown (Sandwich 4 Bước)
> **Mục đích**: Triệt tiêu rác dữ liệu sau kiểm thử. Kịch bản ghi (`.write.spec.ts`) phải tự khởi tạo và tự dọn dẹp trong khối `finally`.

```typescript
test("Toàn trình tạo sản phẩm: Seed API ➔ UI Verify ➔ Cleanup API", async ({
  productService,
  productsPage,
}) => {
  let createdProductId: number | null = null;
  const uniqueName = `Item_${Date.now()}`;

  try {
    // Bước 1 (API Seed): Khởi tạo nhanh dữ liệu nguồn
    const created = await productService.createProduct({ name: uniqueName, price: 50000 });
    createdProductId = created.id;

    // Bước 2 & 3 (UI Action & Verify): Kiểm tra hiển thị trên giao diện người dùng
    await productsPage.navigate();
    await productsPage.expectProductVisible(uniqueName);
  } finally {
    // Bước 4 (API Teardown): Dọn dẹp sạch sẽ dữ liệu vừa tạo trong mọi trường hợp
    if (createdProductId) {
      await productService.deleteProduct(createdProductId);
    }
  }
});
```

---

## 5. Quy Chuẩn Bất Biến Khi Viết Test Spec

1. **100% Import từ Domain Fixture**: `import { test, expect } from "@fixtures/<domain>";`.
2. **Cấm import `@playwright/test`** trong business specs.
3. **Cấm tạo manual context**: Không gọi `request.newContext()` hay `browser.newContext()` trong spec (mọi context phải được quản lý bởi Fixture).
4. **Zero Raw Locators**: Mọi thao tác UI phải đi qua Page Objects.
5. **Zero `waitForTimeout`**: Đồng bộ hoàn toàn bằng auto-waiting assertions (`toBeVisible()`, `toContainText()`) hoặc `page.waitForResponse()`.

---

## 6. Domain Scaffolding Playbook (Khởi Tạo Domain Mới Từ A-Z)

Khi được yêu cầu tạo một domain mới (ví dụ: `crm`, `banking`, `logistics`), Agent **BẮT BUỘC** thực hiện tuần tự theo quy trình 4 bước sau để đảm bảo 100% tính tương thích kiến trúc:

### Bước 1: Khởi tạo cây thư mục chuẩn (Canonical Skeleton)
Tạo toàn bộ các thư mục theo ranh giới 3 tầng:
```bash
src/infrastructure/
├── api/
│   ├── clients/<domain>/               # HTTP Transport thô
│   ├── services/<domain>/              # Business Operations & Validation
│   └── schemas/<domain>/               # Zod contracts & Factories
├── ui/
│   └── pages/<domain>/                 # Page Objects (kế thừa BasePage)
└── fixtures/<domain>/                  # 6-Contract Super Fixture
```

### Bước 2: Tạo bộ 4 Fixture Boilerplate & Barrel Export
Trong thư mục `src/infrastructure/fixtures/<domain>/`, tạo đủ 5 file:
1. **`<domain>-auth.fixture.ts`**:
   - Khởi tạo Worker-Scope RAM Snapshot (lưu token trong RAM CPU, 0ms disk I/O).
   - Cung cấp `guestContext` (100% clean) và `guestPage` cho các luồng login, form validation.
2. **`<domain>-app.fixture.ts`**:
   - Inject tất cả các Page Object Models của domain: `loginPage`, `dashboardPage`, v.v.
3. **`<domain>-services.fixture.ts`**:
   - Inject API Clients và Services có sẵn Token từ RAM Snapshot.
4. **`<domain>-super-gatekeeper.fixture.ts`**:
   - Hợp nhất (merge) toàn bộ: `auth.extend(app).extend(services)`.
5. **`index.ts`** (Barrel Export):
   ```typescript
   export { test, expect } from "./<domain>-super-gatekeeper.fixture";
   ```
6. **`README.md`**:
   - Tài liệu hóa manifest các fixtures, roles và tài khoản kiểm thử.

### Bước 3: Đăng ký Path Alias vào `tsconfig.json`
Mở `tsconfig.json` và bổ sung cụm alias cho domain mới:
```json
"@fixtures/<domain>/*": ["src/infrastructure/fixtures/<domain>/*"],
"@fixtures/<domain>": ["src/infrastructure/fixtures/<domain>/index.ts"],
"@pages/<domain>/*": ["src/infrastructure/ui/pages/<domain>/*"],
"@clients/<domain>/*": ["src/infrastructure/api/clients/<domain>/*"],
"@services/<domain>/*": ["src/infrastructure/api/services/<domain>/*"],
"@schemas/<domain>/*": ["src/infrastructure/api/schemas/<domain>/*"]
```

### Bước 4: Đăng ký Project vào `playwright.config.ts`
1. Khai báo biến môi trường baseline trong `configs/playwright.base.config.ts`:
   ```typescript
   export const <DOMAIN>_UI_ORIGIN = EnvManager.get("<DOMAIN>_UI_URL", "https://...");
   export const <DOMAIN>_API_URL = EnvManager.get("<DOMAIN>_API_URL", "https://api...");
   ```
2. Thêm Project Suites vào `playwright.config.ts`:
   ```typescript
   // 1. Setup Auth
   {
     name: '<domain>-setup',
     testMatch: '**/<domain>.setup.ts',
     testDir: Paths.fixtures('<domain>'),
   },
   // 2. UI Test Suite
   {
     name: '<domain>-ui',
     testDir: Paths.tests('<domain>/04-ui'),
     use: { baseURL: <DOMAIN>_UI_ORIGIN },
     dependencies: ['<domain>-setup'],
   },
   // 3. API Test Suite
   {
     name: '<domain>-api',
     testDir: Paths.tests('<domain>/03-api'),
     use: { baseURL: <DOMAIN>_API_URL },
   }
   ```

---

## 7. Playbook Debugging & Chẩn Đoán Lỗi Kiểm Thử (Flaky Test Diagnosis)

Khi một test case bị FAIL trong lúc chạy local hoặc CI/CD, Agent **BẮT BUỘC** điều tra theo quy trình 4 bước chẩn đoán gốc rễ (Root Cause Taxonomy), tuyệt đối không đoán mò hay sửa mã nguồn bừa bãi:

### Bước 1: Phân tích Log Console từ `Logger.ts`
- Tìm prefix môi trường: `[🖥️ Desktop]` hoặc `[📱 Mobile]`.
- Xác định hành động cuối cùng trước khi văng lỗi:
  - `👆 Click <selector>` ➔ Thất bại trong việc tương tác phần tử.
  - `⌨️ Fill <selector>` ➔ Input không nhận focus hoặc bị disabled.
  - `🔍 Expect` ➔ Sai lệch dữ liệu hoặc Timeout khẳng định.

### Bước 2: Khai thác Playwright Trace Viewer
Playwright tự động xuất file trace khi test fail tại thư mục `test-results/`:
```bash
npx playwright show-trace test-results/<folder-chua-test-fail>/trace.zip
```
- **Filmstrip**: Xem ảnh chụp giao diện từng mili-giây để phát hiện: Có popup che khuất không? Drawer có kịp mở ra không? Có thông báo lỗi backend hiển thị trên UI không?
- **Action Log**: Xem chi tiết Actionability checks: element có visible, stable, enabled không.
- **Network Tab**: Kiểm tra request API ngầm: Có mã `500 Internal Server Error`, `401 Unauthorized`, hay `CORS error` không.

### Bước 3: Đọc Smart Report
Mở báo cáo HTML tại `playwright-report/smart-report.html` hoặc chạy lệnh:
```bash
npx playwright show-report
```
Đọc kỹ phần **Call Log** và **Error Stack** để biết chính xác dòng code và thời gian timeout.

### Bước 4: Cây phân loại nguyên nhân gốc rễ (Root Cause Taxonomy)

| Nhóm lỗi | Biểu hiện thường gặp | Nguyên nhân gốc rễ | Giải pháp chuẩn framework |
| :--- | :--- | :--- | :--- |
| **1. Strict Mode Violation** | `Error: strict mode violation: ... resolved to 2 elements` | Cả 2 phần tử Desktop & Mobile cùng tồn tại trong DOM (CSS display) | Dùng **Inline Colocated Ternary** `this.isMobile() ? mobile : desktop` trong `pageLocators`. Tuyệt đối không dùng `locator.or()`. |
| **2. Hidden / Obscured Element** | `locator.click: Timeout 10000ms exceeded ... element is not visible` | Trên Mobile: link nằm trong Drawer trượt chưa được mở; hoặc Modal overlay đang che | Gọi phương thức chuẩn bị (ví dụ `openMenuIfMobile()`) trước khi click link. |
| **3. Backend / Network Failure** | Response trả về status `500`, `502`, hoặc API Timeout | Payload API sai cấu trúc, backend database lỗi, hoặc service phụ thuộc bị sập | So sánh payload với Zod schema trong `api/schemas/`. Bổ sung logging response body khi `!res.ok()`. |
| **4. Auth Token Expired** | Bị chuyển hướng về `/login` hoặc API trả về `401 Unauthorized` | Token trong RAM snapshot hết hạn hoặc setup project chưa chạy | Kiểm tra project dependency `dependencies: ['<domain>-setup']`. Chạy lại setup để nạp token mới. |
| **5. Race Condition / Flakiness** | Test lúc pass lúc fail khi chạy CI đa luồng | Thao tác UI xảy ra trước khi hiệu ứng kết thúc hoặc không đợi API network | Sử dụng `Promise.all([page.waitForResponse(...), action])` hoặc assertions tự động đợi (`toBeVisible()`). Cấm dùng `waitForTimeout`. |
| **6. Data Collision** | Bị lỗi trùng mã (Unique constraint violation) | Dữ liệu test dùng tên cứng cố định bị đụng độ giữa các worker song song | Chuyển sang Dynamic Data Factory với timestamp duy nhất: `Date.now()`. Dùng Sandwich 4 bước để teardown. |

---

## 8. Chiến Lược Quản Lý Dữ Liệu Kiểm Thử (Test Data Strategy)

Để tránh xung đột dữ liệu khi chạy song song (`workers: 4`) và giữ repo sạch bóng, Agent phải phân định ranh giới giữa 2 chiến lược dữ liệu sau:

```
                      ┌─────────────────────────────────┐
                      │    PHÂN LOẠI TEST DATA          │
                      └────────────────┬────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│   1. STATIC TEST DATA         │             │   2. DYNAMIC TEST-OWNED DATA  │
│   (Từ điển / Validation Form) │             │   (Dành cho kịch bản GHI)     │
├───────────────────────────────┤             ├───────────────────────────────┤
│ • File JSON trong data/       │             │ • Factory trong api/schemas/  │
│ • TestDataRepository.ts       │             │ • Date.now() / Unique suffix  │
│ • Catalog Pattern (as const)  │             │ • Zod Schema validation       │
│ • structuredClone an toàn     │             │ • Bắt buộc Sandwich Teardown  │
│ • Dùng cho .read.spec.ts      │             │ • Dùng cho .write.spec.ts     │
└───────────────────────────────┘             └───────────────────────────────┘
```

### 8.1. Chiến Lược 1: Static Test Data (Catalog Pattern qua `TestDataRepository.ts`)

- **Áp dụng cho**:
  - Dữ liệu từ điển, danh mục cố định không thay đổi: Danh sách tỉnh thành, mã bưu chính, danh sách ngân hàng, đơn vị tiền tệ.
  - Ma trận kiểm thử Validation Form cố định (Negative Testing): Danh sách email sai cú pháp, danh sách mật khẩu không đủ độ dài, danh sách ký tự đặc biệt XSS/SQLi.
- **Quy cách triển khai**:
  1. Đặt file JSON tại: `src/infrastructure/data/<domain>/json/<namespace>.json`.
  2. Khai báo cấu trúc chuẩn:
     ```json
     {
       "invalidEmails": {
         "description": "Các trường hợp email không hợp lệ",
         "data": ["plainaddress", "@missingusername.com", "username@.com"]
       }
     }
     ```
  3. Đăng ký vào `testDataCatalog` trong [`TestDataRepository.ts`](file:///e:/Khoa%20hoc/playwrigt-ts-framework-202603/src/infrastructure/data/common/TestDataRepository.ts):
     ```typescript
     import loginCases from '../<domain>/json/login.json' with { type: 'json' };
     export const testDataCatalog = {
       // ...
       loginCases,
     } as const satisfies DataCatalog;
     ```
  4. Sử dụng trong test với tính năng type-safe autocomplete và tự động deep-clone (không bao giờ sợ test này làm biến đổi dữ liệu của test khác):
     ```typescript
     const testData = getTestData('loginCases', 'invalidEmails');
     ```

### 8.2. Chiến Lược 2: Dynamic Test-Owned Data (Factory + Unique Timestamp)

- **Áp dụng cho**:
  - Tất cả các kịch bản ghi dữ liệu (`.write.spec.ts`): Thêm mới sản phẩm, tạo đơn hàng, sửa thông tin khách hàng, upload tài liệu.
  - Mọi kịch bản chạy song song đa luồng (`workers: 4`).
- **Quy cách triển khai**:
  1. Khai báo Factory tại: `src/infrastructure/api/schemas/<domain>/<Entity>Schemas.ts`.
  2. Tạo hàm sinh dữ liệu tự động gắn timestamp duy nhất:
     ```typescript
     export class ProductSchemas {
       static createPayload(overrides?: Record<string, unknown>) {
         const unique = Date.now();
         return {
           productCode: `PRD_${unique}`,
           name: `Auto Product ${unique}`,
           price: 100000,
           ...overrides,
         };
       }
     }
     ```
  3. **Quy tắc Vàng (Sandwich Teardown)**: Bất kỳ test case nào tạo Dynamic Data đều phải dọn dẹp sạch sẽ trong `finally`:
     ```typescript
     test("Tạo và xóa sản phẩm", async ({ productService, productsPage }) => {
       let createdId: number | null = null;
       const payload = ProductSchemas.createPayload();
       try {
         const res = await productService.createProduct(payload);
         createdId = res.id;
         // Thực hiện kiểm thử trên UI...
       } finally {
         if (createdId) {
           await productService.deleteProduct(createdId);
         }
       }
     });
     ```
