# 🏛️ System Patterns: Các Mẫu Thiết Kế Bất Biến

## 1. Cấu Trúc 3 Tầng Cho Từng Domain
```
src/infrastructure/
├── api/
│   ├── clients/<domain>/               # HTTP Transport thô (nhận APIRequestContext)
│   ├── services/<domain>/              # Nghiệp vụ cấp cao (res.ok(), Zod validation)
│   └── schemas/<domain>/               # Zod runtime contracts & Factory models
├── ui/
│   └── pages/<domain>/                 # Page Objects (kế thừa BasePage)
└── fixtures/<domain>/                  # 6-Contract Super Fixture
```

## 2. The 6-Contract Super Fixture Manifest
Mỗi domain barrel (`@fixtures/<domain>`) cung cấp đủ 6 hợp đồng:
- `workerSnapshots`: Đăng nhập 1 lần duy nhất mỗi worker, lưu token trong RAM CPU. 0ms disk I/O.
- `page`: Trang mặc định đã nạp sẵn session đã đăng nhập.
- `guestContext` & `guestPage`: Trình duyệt sạch 100% (Zero Auth) cho kịch bản login, 401, validation.
- `loginPage`: POM đăng nhập gắn sẵn vào guestPage.
- `uiSessions` & `apiSessions`: Named POMs và API Services tương ứng từng role.

## 3. Locator Map Pattern
```typescript
private readonly pageLocators = {
  heading: (page: Page) => page.getByRole('heading', { name: 'Title' }),
  menuBtn: (page: Page) =>
    this.isMobile()
      ? page.getByTestId('header-button-mobile-menu')
      : page.locator('header button.lg\\:relative'),
};
public element = this.createLocatorGetter(this.pageLocators);
```

## 4. Responsive Locators (Inline Colocated Ternary)
- **Tuyệt đối cấm**: `locator.or()` (gây lỗi Strict Mode Violation khi cả 2 elements cùng tồn tại trong DOM).
- **Quy chuẩn**: Dùng inline ternary `this.isMobile() ? mobile : desktop` trong `pageLocators`.
- `BasePage.isMobile()` tự động nhận diện cả fixture `viewportType` lẫn `viewportSize().width < 1024`.
- POM có thể **override `mobileBreakpoint`** khi layout thật dùng breakpoint khác Tailwind (`lg`/`xl`).
  Ví dụ: sidebar Admin của Neko Coffee là `hidden xl:flex` ⇒ POM đặt `mobileBreakpoint = 1280` (breakpoint `xl`).

## 5. UI Contract (Hợp đồng giao diện) — Nguồn sự thật duy nhất
Mỗi POM màn hình dữ liệu khai báo hằng số export ở đầu file, spec import lại thay vì hardcode text:
```typescript
export type OrderColumnKey = 'mãĐơn' | 'kháchHàng' | 'ngàyĐặt' | 'tổngTiền' | 'trạngThái';
export const DEFAULT_ORDER_COLUMNS: string[] = ['mãĐơn', 'kháchHàng', 'ngàyĐặt', 'tổngTiền', 'trạngThái'];
```
- Cột được phân giải bằng cách **quét header `<th>` thật** (`createColumnMap()` → `ColumnMap` key ngữ nghĩa),
  KHÔNG hardcode index cột (`td[2]`), KHÔNG phụ thuộc thứ tự cột FE render.
- Mỗi POM giữ `private columnMapCache: ColumnMap | null` để tái sử dụng bản đồ cột trong cùng một test.
- API truy vấn chuẩn: `findRowByColumnValueSimple()` / `getTableDataSimple()` / `getColumnValuesSimple()` /
  `buildRowDataSimple()`; lỗi ném ra kèm dữ liệu thực tế ⇒ failure message tự chứa bằng chứng.

## 6. Bằng Chứng Khi Tính Năng Chưa Deploy (RED = Bug Evidence)
- **Không dùng feature-guard `test.skip()`** cho tính năng chưa có: bug sẽ bị che khuất trong báo cáo CI.
  Chỉ dùng `test.skip()` cho trường hợp dữ liệu rỗng (empty state).
- Test phải ĐỎ kèm message mô tả rõ bằng chứng: URL, HTTP status / redirect chain, `<title>`, headings,
  table headers thực tế — để failure message tự đóng vai trò báo cáo bug.
- Kỹ thuật thu bằng chứng (dùng `page.on('response')` lọc `resourceType() === 'document'`) và đính kèm
  hiện trường vào report bằng `testInfo.attach(...)` (bug report text + screenshot) đều nằm trong tầng POM/Spec,
  KHÔNG hardcode trong spec.
