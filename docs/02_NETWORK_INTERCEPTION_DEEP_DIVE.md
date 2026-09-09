# 🌐 CẨM NANG TOÀN DIỆN VỀ NETWORK INTERCEPTION & ĐỒNG BỘ MẠNG TRONG PLAYWRIGHT

---

## 📑 MỤC LỤC
1. [Bản chất Network Interception (CDP Level)](#1-bản-chất-network-interception-cdp-level)
2. [4 Hành Vi Can Thiệp Mạng Cốt Lõi](#2-4-hành-vi-can-thiệp-mạng-cốt-lõi)
   - 2.1. `route.fulfill()`: Mock Data & Mã Lỗi Tùy Biến
   - 2.2. `route.abort()`: Chặn Ảnh & Tracking Scripts
   - 2.3. `route.continue()`: Tiêm Custom Header & Feature Flag
   - 2.4. `route.fetch()` + Response Tampering: Tráo Đổi Dữ Liệu Thực Tế
3. [Kỹ Thuật Bơm Độ Trễ Mạng (Latency Injection)](#3-kỹ-thuật-bơm-độ-trễ-mạng-latency-injection)
4. [So Sánh Bản Chất: `page.route` vs `page.waitForResponse`](#4-so-sánh-bản-chất-pageroute-vs-pagewaitforresponse)
5. [4 Trường Hợp Bất Khả Kháng Bắt Buộc Dùng `waitForResponse`](#5-4-trường-hợp-bất-khả-kháng-bắt-buộc-dùng-waitforresponse)
6. [Pattern Chuẩn "Giăng Lưới Trước — Ném Đá Sau" (Promise.all)](#6-pattern-chuẩn-giăng-lưới-trước--ném-đá-sau-promiseall)
7. [Ghi Âm Lưu Lượng Mạng (HAR Recording) & Phát Lại Ngoại Tuyến (Offline Replay)](#7-ghi-âm-lưu-lượng-mạng-har-recording--phát-lại-ngoại-tuyến-offline-replay)

---

## 1. Bản chất Network Interception (CDP Level)

Playwright không sử dụng Proxy trung gian (như BrowserMob hay Charles Proxy) vốn làm giảm hiệu năng mạng. Thay vào đó, Playwright can thiệp trực tiếp vào nhân trình duyệt Chromium thông qua **Chrome DevTools Protocol (CDP)** tại domain `Network`:

```text
[ Browser DOM (React / Next.js) ]
          │  Gửi request: fetch('/api/products')
          ▼
[ CDP Network Domain (Playwright Interceptor) ]
     ├── route.fulfill() ──► Trả về Mock JSON ngay lập tức (Backend không hề biết!)
     ├── route.abort()   ──► Hủy request ngay tại browser stack
     └── route.fetch()   ──► Gửi tới Server thật rồi can thiệp chỉnh sửa dữ liệu
```

> ⚠️ **Quy tắc bất biến**: `page.route()` PHẢI luôn được đăng ký **TRƯỚC** khi hành động kích hoạt request diễn ra.

---

## 2. 4 Hành Vi Can Thiệp Mạng Cốt Lõi

### 2.1. `route.fulfill()`: Mock Data & Mã Lỗi
Giúp kiểm thử giao diện trong điều kiện biên (Edge Cases) mà Backend khó hoặc không thể tái hiện:
- **Mock 200 OK**: Giả lập danh sách 500 sản phẩm hoặc sản phẩm có ký tự đặc biệt XSS `<script>alert(1)</script>`.
- **Mock 500 Crash**: Kiểm tra giao diện Error Boundary của React có hiển thị trang lỗi thân thiện không.
- **Mock 429 Rate Limit**: Trả về header `Retry-After: 300` để kiểm tra bộ đếm ngược trên giao diện người dùng.

```typescript
await page.route('**/api/products*', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    json: { items: [{ id: 999, name: 'Mock Special Coffee', price_per_unit: 500000 }] }
  });
});
```

### 2.2. `route.abort()`: Chặn Ảnh & Tracking Scripts
Loại bỏ các tài nguyên nặng và tracking của bên thứ ba:
- Tăng tốc độ chạy test lên 200% - 300%.
- Giảm thiểu flakiness do mạng Internet chập chờn khi tải tài nguyên bên thứ 3.

```typescript
await page.route('**/*.{png,jpg,jpeg,webp,svg}', route => route.abort());
await page.route('**/google-analytics.com/**', route => route.abort());
```

### 2.3. `route.continue()`: Tiêm Custom Header & Feature Flag
Can thiệp sửa đổi gói tin HTTP Request đang bay đi mà không làm gián đoạn luồng:
```typescript
await page.route('**/api/**', async (route) => {
  const headers = {
    ...route.request().headers(),
    'X-Feature-Flag': 'VIP_NEON_BANNER_2026',
  };
  await route.continue({ headers });
});
```

### 2.4. `route.fetch()` + Response Tampering: Tráo Đổi Dữ Liệu Thực Tế
Bắt gói tin thật từ Server, giải mã JSON, thay đổi một trường thông tin nhạy cảm (như quyền `role: admin` hoặc số dư tài khoản `1.000.000.000đ`), sau đó trả về cho Frontend:
```typescript
await page.route('**/api/wallet/balance', async (route) => {
  const response = await route.fetch();
  const json = await response.json();
  json.balance = 1_000_000_000; // Phù phép số dư 1 tỷ
  await route.fulfill({ response, json });
});
```

---

## 3. Kỹ Thuật Bơm Độ Trễ Mạng (Latency Injection)

Dùng để thẩm định xem Frontend có hiển thị Loading Spinner và vô hiệu hóa nút bấm (`disabled`) hay không nhằm chống hiện tượng **Spam Click / Double Submit**:

```typescript
await page.route('**/api/orders/checkout', async (route) => {
  // Giữ chân gói tin trong 2000ms
  await new Promise(r => setTimeout(r, 2000));
  await route.continue();
});

// UI Test: Bấm nút và assert ngay nút bị disabled
await page.click('#btn-checkout');
await expect(page.locator('#btn-checkout')).toBeDisabled();
await expect(page.locator('.spinner')).toBeVisible();
```

---

## 4. So Sánh Bản Chất: `page.route` vs `page.waitForResponse`

| Tiêu chí | `page.route()` | `page.waitForResponse()` |
| :--- | :--- | :--- |
| **Bản chất** | **Can thiệp chủ động** (Active Interceptor) | **Quan sát thụ động** (Passive Observer) |
| **Ảnh hưởng mạng** | Có thể thay đổi, hủy hoặc mock dữ liệu | Không làm thay đổi bất kỳ byte dữ liệu nào |
| **Mục đích** | Tạo dữ liệu giả lập, ép mã lỗi, tăng tốc | Đợi Backend xử lý xong để đồng bộ UI |
| **Vị trí** | Đứng giữa Browser và Network | Lắng nghe sự kiện phản hồi từ Network |

---

## 5. 4 Trường Hợp Bất Khả Kháng Bắt Buộc Dùng `waitForResponse`

1. **Async Background Jobs**: Thao tác bấm nút "Xuất báo cáo", server tốn 3 giây để render file ngầm.
2. **Dynamic ID Generation**: Bấm nút "Tạo đơn hàng", database tự sinh mã đơn `#ORD-9982`. Cần bắt response để lấy mã đơn kiểm tra ở bước tiếp theo.
3. **Fire-and-Forget UI Triggers**: Giao diện React đổi trạng thái trước khi Server phản hồi (Optimistic UI). Phải đợi response 200 để khẳng định dữ liệu thực tế đã lưu DB thành công.
4. **Backend Protocol Audit**: Thẩm định mã status code, latency (ms), headers (`content-type`, `cache-control`) trong một kịch bản End-to-End thực tế.

---

## 6. Pattern Chuẩn "Giăng Lưới Trước — Ném Đá Sau" (Promise.all)

> ❌ **Sai lầm phổ biến của Junior**: Click nút trước, rồi mới gọi `waitForResponse()`. Lúc này request đã hoàn tất từ trước, Playwright sẽ chờ đến khi timeout!

```typescript
// ✅ Chuẩn Senior: Giăng lưới (Promise) trước, Ném đá (Click) sau
const [response] = await Promise.all([
  page.waitForResponse(res => 
    res.url().includes('/api/products') && 
    res.status() === 200 &&
    res.request().method() === 'POST'
  ),
  page.click('#btn-save-product')
]);

const data = await response.json();
console.log('Mã sản phẩm vừa tạo:', data.id);
```

---

## 7. Ghi Âm Lưu Lượng Mạng (HAR Recording) & Phát Lại Ngoại Tuyến (Offline Replay)

Khi chạy test trên CI/CD mà hệ thống staging bên thứ 3 bị sập hoặc chập chờn:
1. **Thu âm (Record)**:
   ```typescript
   await page.routeFromHAR('playwright/.har/products.har', { update: true, url: '**/public/products*' });
   ```
2. **Phát lại (Replay)**:
   ```typescript
   // Chạy offline 100% không cần kết nối Internet
   await page.routeFromHAR('playwright/.har/products.har', { notFound: 'fallback' });
   ```
