# 🌐 Neko Coffee — Network Interception Labs (Technical Showroom)

> [!IMPORTANT]
> **QUY CHUẨN KIẾN TRÚC & PHÂN ĐỊNH RANH GIỚI**:
> Thư mục này là **phòng lab kỹ thuật (Technical Showroom / Labs)** chuyên sâu về các API can thiệp mạng cấp thấp (*Low-Level Network Interception APIs*) của Playwright.
> 
> - **Mục đích**: Minh họa cơ chế hoạt động chi tiết của `page.route()`, `route.fulfill()`, `route.abort()`, `page.waitForResponse()`, và `HAR recording/replay`.
> - **Lý do không dùng POM**: Các kịch bản tại đây **cố tình viết inline (trực tiếp)**, không bọc qua Page Object Model (POM) để người đọc/kỹ sư quan sát tường minh luồng bắt gói tin và can thiệp payload HTTP.
> - **⚠️ LƯU Ý KHI VIẾT TEST MỚI**: **TUYỆT ĐỐI KHÔNG** sao chép cấu trúc của thư mục này làm template mẫu cho các test E2E hoặc kiểm thử chức năng nghiệp vụ mới.
>   - Đối với bài test chức năng / E2E: Tham khảo chuẩn Enterprise tại [`src/presentation/tests/neko/02-hybrid-e2e/`](../02-hybrid-e2e/) và sử dụng Super Fixture `@fixtures/neko`.

---

## 📚 Danh mục các bài Lab kỹ thuật

| File | Chuyên đề kỹ thuật | API trọng tâm |
| :--- | :--- | :--- |
| [`01-mocking-and-route-fulfill.spec.ts`](./01-mocking-and-route-fulfill.spec.ts) | Giả lập dữ liệu và phản hồi mạng | `page.route()`, `route.fulfill({ json, status })` |
| [`02-route-abort-and-modify.spec.ts`](./02-route-abort-and-modify.spec.ts) | Chặn tài nguyên & sửa đổi request header | `route.abort()`, `route.continue({ headers })` |
| [`03-wait-for-response-and-ui-sync.spec.ts`](./03-wait-for-response-and-ui-sync.spec.ts) | Đồng bộ mạng & UI (Network Synchronization) | `page.waitForResponse()`, `Promise.all([waitForResponse, action])` |
| [`04-login-screen-interception.spec.ts`](./04-login-screen-interception.spec.ts) | Giả lập các trạng thái biên của màn hình Auth | Mock 401 Unauthorized, 500 Server Error, Network Delay |
| [`05-har-recording-and-replay.spec.ts`](./05-har-recording-and-replay.spec.ts) | Ghi log và phát lại lưu lượng mạng bằng HAR | `routeFromHAR()`, `recordHar` |
| [`06-nextjs-route-mock-showroom.spec.ts`](./06-nextjs-route-mock-showroom.spec.ts) | Can thiệp Next.js App/Pages Router | Intercept Server Component & Client Fetch calls |

---

## 🎯 Mẫu kiến trúc chuẩn cho bài test mới (Best Practices Reference)

Khi triển khai các kịch bản kiểm thử mới cho Neko Coffee, hãy tuân theo cấu trúc **Hybrid Sandwich** chuẩn:

```typescript
import { test, expect } from '@fixtures/neko';

test.describe('Feature Name @tag', () => {
  test('Kịch bản nghiệp vụ chuẩn Enterprise', async ({
    page,                  // Browser Page (đã tiêm phiên qua addInitScript)
    authedStaffClient,     // API Client (đã gắn sẵn Bearer Token trong RAM)
    adminOrdersPage,       // Page Object Model (POM)
  }) => {
    // 1. API Seed Data (Nhanh, tin cậy, không qua form UI)
    const newOrder = await authedStaffClient.productApi.create(...);

    // 2. UI Action qua POM (Không dùng direct locator hay waitForTimeout)
    await adminOrdersPage.navigate();
    await adminOrdersPage.filterByKeyword(newOrder.code);

    // 3. Web-First Assertion & UI Audit
    const row = await adminOrdersPage.findOrderRowByCode(newOrder.code);
    await expect(row).toBeVisible();

    // 4. API Teardown / Cleanup (Đảm bảo Zero Data Pollution)
  });
});
```
