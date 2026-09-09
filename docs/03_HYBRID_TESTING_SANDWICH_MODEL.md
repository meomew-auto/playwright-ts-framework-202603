# 🥪 CẨM NANG HYBRID TESTING (MÔ HÌNH BÁNH KẸP SANDWICH) & XÁC THỰC SIÊU TỐC

---

## 📑 MỤC LỤC
1. [Tại sao 100% Pure UI là sự lãng phí?](#1-tại-sao-100-pure-ui-là-sự-lãng-phí)
2. [Mô Hình Bánh Kẹp (Sandwich Model 3 Lớp)](#2-mô-hình-bánh-kẹp-sandwich-model-3-lớp)
3. [Ba Nấc Xác Thực (Auth Tiers) Trong Playwright](#3-ba-nấc-xác-thực-auth-tiers-trong-playwright)
   - 3.1. Nấc 1: File Đĩa (`.auth/`) & Project Dependencies
   - 3.2. Nấc 2: Worker Scope RAM Snapshot (0ms)
   - 3.3. Nấc 3: Dynamic In-Memory Injection (`context.addInitScript`)
4. [Multi-Role Testing với `asRole()` & Cô Lập Phiên](#4-multi-role-testing-với-asrole--cô-lập-phiên)
5. [5 Mô Hình Hybrid Thực Tế Trong Doanh Nghiệp](#5-5-mô-hình-hybrid-thực-tế-trong-doanh-nghiệp)
6. [Ma Trận So Sánh Toàn Diện: Pure UI vs Pure API vs Hybrid](#6-ma-trận-so-sánh-toàn-diện-pure-ui-vs-pure-api-vs-hybrid)

---

## 1. Tại sao 100% Pure UI là sự lãng phí?

Giả sử bạn cần kiểm thử tính năng: **"Quản trị viên chuyển trạng thái Đơn hàng sang Đã Hủy"**:
- **Cách làm Pure UI 100% (Mất 35 giây)**:
  1. Mở trang Login ➔ Gõ username/pass ➔ Bấm Login (5s).
  2. Mở danh mục sản phẩm ➔ Bấm thêm sản phẩm vào giỏ ➔ Điền thông tin giao hàng ➔ Bấm thanh toán tạo đơn (15s).
  3. Mở menu Quản lý đơn hàng ➔ Tìm đơn vừa tạo ➔ Bấm nút Hủy đơn (10s).
  4. Đăng xuất hoặc để lại dữ liệu rác trong database (5s).
- **Cách làm Hybrid Sandwich (Mất 2.5 giây)**:
  1. **Top Bread (API)**: Gọi API tạo đơn hàng mới trong 100ms.
  2. **Meat (UI)**: Mở thẳng trang `/admin/orders` (đã tiêm phiên xác thực trong 0ms), tìm đúng đơn và bấm Hủy đơn (2s).
  3. **Bottom Bread (API)**: Gọi API kiểm tra Database xem đơn đã thành `cancelled` chưa, và xóa dọn dẹp dữ liệu (400ms).

> 💡 **Kết quả**: Nhanh gấp **14 lần**, loại bỏ 90% nguy cơ flaky test do mạng hoặc UI render chậm ở các bước trung gian!

---

## 2. Mô Hình Bánh Kẹp (Sandwich Model 3 Lớp)

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 🍞 LỚP 1: BÁNH MÌ TRÊN — FAST API SEED (< 150ms)                      │
│    • Gọi API tạo User tạm (Disposable Account)                         │
│    • Gọi API tạo Sản phẩm / Đơn hàng mẫu                               │
│    • Chuẩn bị đầy đủ trạng thái dữ liệu (Preconditions)                │
├────────────────────────────────────────────────────────────────────────┤
│ 🥩 LỚP 2: NHÂN THỊT / RAU — TARGETED UI ACTION (~ 2s)                  │
│    • Tiêm phiên đăng nhập thẳng vào Browser Context (addInitScript)    │
│    • Điều hướng trực diện vào màn hình cần kiểm thử (Deep Link)        │
│    • Thao tác chính xác tính năng nghiệp vụ người dùng                 │
├────────────────────────────────────────────────────────────────────────┤
│ 🍞 LỚP 3: BÁNH MÌ DƯỚI — API VERIFICATION & AUTO-TEARDOWN (< 300ms)    │
│    • Gọi API kiểm chứng dữ liệu Backend qua Zod Schema Contract        │
│    • Chống bẫy "Pass ảo" do Optimistic UI của React                    │
│    • Tự động dọn dẹp sạch sẽ (Zero-Pollution)                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Ba Nấc Xác Thực (Auth Tiers) Trong Playwright

### 3.1. Nấc 1: File Đĩa (`.auth/`) & Project Dependencies
- Phù hợp cho các test suite lớn cố định.
- Chạy project `neko-setup` một lần duy nhất trước toàn bộ test suite.
- Lưu trữ cookies và localStorage ra file JSON trên ổ cứng.

### 3.2. Nấc 2: Worker Scope RAM Snapshot (0ms Overhead)
- Định nghĩa trong `hybrid-auth.fixture.ts` với `{ scope: 'worker' }`.
- Playwright khởi chạy mỗi Worker tiến trình sẽ tự động đăng ký/đăng nhập 1 tài khoản Staff.
- Lưu trực tiếp Bearer Token trong RAM của Worker.
- Tái sử dụng vĩnh viễn giữa tất cả các file test thuộc worker đó mà **không gọi lại API login**.

### 3.3. Nấc 3: Dynamic In-Memory Injection (`context.addInitScript`)
- Thay vì phải mở form đăng nhập và gõ bàn phím, Playwright tiêm script JavaScript chạy trước khi bất kỳ file bundle nào của Next.js/React tải xuống:
```typescript
await context.addInitScript(({ token, user }) => {
  localStorage.setItem('access_token', token);
  localStorage.setItem('neko_auth', JSON.stringify({
    state: { user, accessToken: token, isAuthenticated: true }
  }));
}, { token: snapshot.token, user: snapshot.user });
```
- Khi mở bất kỳ URL admin nào, Frontend đọc thấy đã đăng nhập ➔ **0ms thời gian chờ, không bị redirect về trang /login!**

---

## 4. Multi-Role Testing với `asRole()` & Cô Lập Phiên

Trong thực tế, kịch bản nghiệp vụ thường có nhiều vai trò phối hợp (ví dụ: Khách đặt hàng trên UI ➔ Quản lý duyệt đơn trên API; hoặc Admin chat với Staff).

Kiến trúc `asRole` giải quyết bài toán này:
```typescript
test('Admin và Manager chat realtime', async ({ chatPage, asRole }) => {
  // chatPage = Admin mặc định từ fixture
  const manager = await asRole('manager'); // Khởi tạo context riêng cho Manager

  await chatPage.goto();
  await manager.chatPage.goto();

  // Admin gửi tin nhắn trên UI
  await chatPage.sendMessage('Chào bạn quản lý!');

  // Manager nhận được tin nhắn trên cửa sổ độc lập
  await manager.chatPage.expectMessage('Chào bạn quản lý!');
});
```

---

## 5. 5 Mô Hình Hybrid Thực Tế Trong Doanh Nghiệp

1. **Order Status Transition & DB Integrity**: Thao tác đổi trạng thái trên bảng UI ➔ Đón bắt response mạng ➔ Dùng API query database thẩm định tính toàn vẹn của dữ liệu ngầm.
2. **Fast Seed & Customer Tracking**: Dùng API tạo đơn hàng tức thì trong 100ms ➔ Mở trang tra cứu đơn hàng của khách hàng kiểm tra mã vận đơn.
3. **Dual-Role Collaboration**: Quản trị viên điều chỉnh giảm giá sản phẩm qua API ➔ Khách hàng nhìn thấy giá mới trên UI tức thời.
4. **Hybrid Reverse Audit**: Thao tác form trên giao diện ➔ Bắt gói tin API ngầm ➔ Chạy qua `schema.safeParse` của Zod để bắt lỗi Schema Drift.
5. **Zero Pollution Resilience**: Chuẩn bị tài khoản tạm thời (Disposable Account) qua API ➔ Thực hiện thao tác UI ➔ Tự động dọn dẹp bằng `test.afterEach()` để database không chứa dữ liệu rác.

---

## 6. Ma Trận So Sánh Toàn Diện: Pure UI vs Pure API vs Hybrid

| Tiêu Chí | 🖥️ Pure UI | ⚡ Pure API | 🥪 Hybrid Super App |
| :--- | :--- | :--- | :--- |
| **Tốc độ thực thi** | 🔴 Rất chậm (30s - 60s/test) | 🟢 Siêu nhanh (50ms - 200ms) | 🟢 Nhanh ấn tượng (1.5s - 3s) |
| **Độ ổn định (Flakiness)** | 🔴 Thấp (Dễ vỡ do UI rendering) | 🟢 Tuyệt đối | 🟢 Rất cao |
| **Phạm vi bao phủ** | Chỉ bề nổi giao diện | Chỉ tầng máy chủ | Cả giao diện, mạng và Database |
| **Bảo vệ dữ liệu** | 🔴 Dễ ngập rác hệ thống | 🟢 Dọn dẹp dễ dàng | 🟢 Zero-Pollution tự động |
| **Khả năng gỡ lỗi (Debug)** | Khó phân biệt lỗi FE hay BE | Chỉ thấy status code | Thấy rõ cả DOM, Network và Log |
| **Mức độ ứng dụng** | Smoke test cơ bản | Contract / Unit API | **Kịch bản E2E Doanh Nghiệp Thực Chiến** |
