1# Review framework Playwright TypeScript — Các điểm chưa ổn

- **Ngày review:** 2026-09-09
- **Phạm vi:** cấu trúc framework, fixtures/auth, Page Objects, API client, test data, các test CMS/Neko liên quan, Playwright configs và GitHub Actions.
- **Cách kiểm tra:** đọc code, chạy typecheck và test discovery, tái hiện lỗi field mapping offline.
- **Giới hạn:** không chạy E2E lên hệ thống thật để tránh các test tạo/sửa/xóa dữ liệu. Các kết luận về CI dựa trên workflow/config và metadata của Playwright đang cài, không phải một lần chạy GitHub Actions mới.
- **Trạng thái:** ĐÃ KHẮC PHỤC TOÀN DIỆN (R01–R08, C01–C05). Tất cả tiêu chí hoàn tất đã được cài đặt và kiểm chứng qua TypeScript & Playwright discovery.

## Kết luận

Framework có nền tảng tốt: đã tách fixture, POM, API client, schema và data; entrypoint theo domain giúp spec dễ sử dụng. Tuy nhiên, chưa nên chỉ dựa vào kết quả hiện tại để quyết định release.

Các điểm cần ưu tiên là **độ đúng của test, quyền sở hữu dữ liệu test, phạm vi chạy và kiểm tra chất lượng trong CI**, trước khi làm đẹp cấu trúc hay format.

Không cần viết lại framework hoặc thêm nhiều layer chỉ để đúng tên “Clean Architecture”.

## Quy ước mức ưu tiên

| Mức | Ý nghĩa |
| --- | --- |
| **P1** | Cần xử lý trước khi tin cậy suite làm release gate: có thể làm sai lệch kết quả, tác động dữ liệu dùng chung hoặc khiến suite CI không chạy được trên runner mới. |
| **P2** | Lỗi chức năng, contract hoặc cấu hình cần sửa trong đợt cleanup gần nhất. |
| **P3** | Cải thiện maintainability, sự nhất quán và độ gọn; không đồng nghĩa với lỗi runtime. |

---

## R01 — P1: Write tests chưa sở hữu dữ liệu mà chúng xóa

### Vị trí

- `src/presentation/tests/cms/products/ui/manage.write.spec.ts:125–160`
- `src/presentation/tests/cms/products/ui/manage.write.spec.ts:184–195`
- `src/presentation/tests/cms/products/ui/create.write.spec.ts:95–327`
- `src/infrastructure/fixtures/cms/app.fixture.ts:105–115`

### Chưa ổn

- TC_05 lấy sản phẩm đầu tiên có sẵn trên server để xóa.
- TC_06 lấy tối đa hai sản phẩm đầu danh sách để bulk delete.
- TC_08 tìm sản phẩm có sẵn ở trang khác rồi xóa.
- Không có bước seed bảo đảm các sản phẩm bị xóa thuộc riêng lần chạy/test hiện tại.
- Các test tạo sản phẩm publish dữ liệu nhưng chưa có cleanup tương ứng trong spec hoặc fixture POM đã kiểm tra.

`test.describe.configure({ mode: 'serial' })` chỉ điều phối nhóm test đó. Nó không khóa dữ liệu trước các file, project, pipeline hoặc người dùng khác.

### Hậu quả

- Có thể xóa dữ liệu không do test tạo.
- Write tests có thể ảnh hưởng read tests đang chạy đồng thời.
- Kết quả phụ thuộc dữ liệu còn lại trên server và thứ tự chạy.
- Dữ liệu được tạo tích lũy qua các lần chạy.

### Hướng sửa

1. Mỗi write test seed dữ liệu riêng, có ID hoặc tên chứa định danh duy nhất.
2. Chỉ edit/delete đúng dữ liệu vừa seed, ưu tiên ID thay vì vị trí trên danh sách.
3. Dùng fixture teardown hoặc `try/finally` để dọn dữ liệu test tạo; cleanup phải xử lý được trường hợp test đã xóa nó.
4. Không dùng serial như giải pháp thay thế cho data isolation.

### Tiêu chí hoàn tất

- [ ] Không còn delete test chọn mục tiêu bằng “sản phẩm đầu tiên” hoặc slice dữ liệu có sẵn.
- [ ] Chạy riêng từng write test không phụ thuộc lần chạy trước.
- [ ] Chạy read/write đồng thời không đụng dữ liệu của nhau.
- [ ] Test fail giữa chừng vẫn có cleanup dữ liệu do chính test tạo.

## R02 — P1: Delete tests có thể pass dù sản phẩm chưa bị xóa

### Vị trí

- `src/presentation/tests/cms/products/ui/manage.write.spec.ts:140–142`
- `src/presentation/tests/cms/products/ui/manage.write.spec.ts:163–166`
- `src/presentation/tests/cms/products/ui/manage.write.spec.ts:173–175,187–189`
- `src/infrastructure/ui/pages/cms/CMSAllProductsPage.ts:464–489,532–564`

### Chưa ổn

Sau thao tác delete, test đọc lại danh sách và tính sản phẩm còn tồn tại hay không, nhưng **chỉ ghi log**, không assert kết quả.

Các helper delete hiện kiểm tra dialog/table và thực hiện thao tác; chúng chưa xác nhận bản ghi mục tiêu thực sự bị xóa.

Một số test còn `return` khi thiếu dữ liệu. Đây là test kết thúc bình thường, được ghi nhận pass, không phải skip.

### Hậu quả

- Backend không xóa được dữ liệu nhưng test vẫn có thể xanh nếu UI đóng dialog và table vẫn hoạt động.
- Báo cáo có thể ghi nhận pass dù thao tác chính chưa được thực hiện.

### Hướng sửa

- Assert hậu điều kiện bằng locator có retry: bản ghi đúng ID/tên test-owned không còn xuất hiện.
- Khi cần xác nhận persistence, audit bằng API theo ID; không chỉ kiểm tra một trang danh sách vì bản ghi có thể chuyển vị trí/phân trang.
- Với trường hợp thiếu dữ liệu: seed đủ dữ liệu, fail rõ ràng, hoặc dùng `test.skip()` với lý do hợp lệ. Không “skip” bằng `return`.

### Tiêu chí hoàn tất

- [ ] Khi mô phỏng delete không thành công trong môi trường kiểm thử cô lập, test phải fail.
- [ ] Mọi test delete đều có assertion sau hành động.
- [ ] Trường hợp không chạy được hành động chính không bị báo pass giả.

## R03 — P1: CMS mobile trong CI chưa được cài browser cần thiết

### Vị trí

- `.github/workflows/playwright.yml:93–107`
- `playwright.config.ts:97–106`

### Chưa ổn

Project `cms-mobile` dùng `devices['iPhone 12']`. Metadata của Playwright đang cài xác nhận profile này có:

```json
{
  "defaultBrowserType": "webkit",
  "isMobile": true
}
```

Workflow chỉ cài Chromium và dependencies của Chromium:

```sh
npx playwright install --with-deps chromium
npx playwright install-deps chromium
```

### Hậu quả

Trên runner/cache mới không có WebKit, suite CMS mobile không được provision đầy đủ để khởi chạy browser.

### Hướng sửa

- Cài browser và OS dependencies theo suite được chọn.
- Suite CMS mobile cần WebKit.
- Bảo đảm cache key/phạm vi cache và nhánh cache-hit không bỏ sót browser hoặc dependencies cần thiết.

### Tiêu chí hoàn tất

- [ ] Chạy CMS mobile được trên runner mới, không dựa vào cache tình cờ có sẵn.
- [ ] Cả nhánh cache-hit và cache-miss đều chuẩn bị đúng browser/dependencies.

## R04 — P2: Product field mapping không khớp, đã tái hiện lỗi offline

### Vị trí

- `src/infrastructure/ui/pages/neko-coffee/ProductsPage.ts:37–42`
- `src/infrastructure/ui/pages/neko-coffee/ProductsPage.ts:217–219`
- `src/infrastructure/helpers/common/collection/GridResolver.ts:56–63`
- `src/presentation/tests/neko/04-ui/products-list.spec.ts:141–147`

### Chưa ổn

`getProductData()` yêu cầu:

```ts
['name', 'price', 'type']
```

Trong khi `PRODUCT_FIELD_MAP` chỉ có `name`, `price`, `image`, `category`. TC_15 gọi đúng đường code này.

### Bằng chứng

Đã lấy field map và danh sách field từ source, gọi resolver hiện tại với locator stub, không mở browser và không gọi server:

```text
name: PASS
price: PASS
type: REPRODUCED -> GridResolver: Không tìm thấy field "type". Các field có sẵn: name, price, image, category
```

### Hướng sửa

- Thống nhất tên field giữa mapping và caller.
- Ràng buộc kiểu field theo `keyof` mapping để TypeScript bắt được field không tồn tại.
- Thêm kiểm tra cục bộ cho contract giữa POM và resolver.

### Tiêu chí hoàn tất

- [ ] `getProductData()` không yêu cầu field ngoài mapping.
- [ ] TC_15 chạy được trên dữ liệu test hợp lệ.
- [ ] Sai tên field bị bắt sớm bởi typecheck hoặc test của helper.

## R05 — P2: Root/cross-browser config đang chọn quá rộng và chạy lặp suite

### Vị trí

- `playwright.config.ts:113–147`
- `configs/playwright.cross-browser.config.ts:22–98`

### Chưa ổn

Các browser project dùng toàn bộ thư mục tests thay vì giới hạn vào UI suite cần kiểm tra tương thích. Vì vậy API, write tests và demo tests cũng bị nhân theo browser.

Các browser project này không được gắn setup dependency và auth configuration theo domain như các project CMS/Neko chuyên biệt.

### Bằng chứng từ test discovery

| Cấu hình | Số lượt test được chọn |
| --- | ---: |
| Root config | 1.052 |
| CMS standalone | 59 |
| Neko standalone | 118 |
| API fast-track | 22 |
| Cross-browser standalone | 1.050 |

Root config gồm 177 lượt thuộc các project domain, có tính setup; cộng thêm 875 lượt do toàn bộ 175 test thường được chọn trên mỗi project trong 5 browser project.

**Lưu ý:** đây là số lượt discovery, không phải số test đã chạy hoặc pass.

### Hậu quả

- Lệnh mặc định có phạm vi lớn hơn dự kiến.
- Test API/write bị lặp không cần thiết theo browser.
- Tăng thời gian chạy, lượng dữ liệu tạo/xóa và khả năng xung đột.
- Các lần chạy cùng spec dưới project khác nhau không có cấu hình domain tương đương.

### Hướng sửa

- Định nghĩa bộ mặc định có chủ đích trong root config.
- Giữ cross-browser là lệnh/config riêng.
- Chỉ chọn UI suite phù hợp cho ma trận browser.
- Khai báo base URL, auth state và setup dependencies rõ theo từng domain.

### Tiêu chí hoàn tất

- [ ] Discovery của lệnh mặc định khớp phạm vi đã công bố.
- [ ] API tests không bị nhân theo browser nếu không có lý do cụ thể.
- [ ] CMS/Neko UI projects có auth/setup đúng, kể cả trong cross-browser config.

## R06 — P2: Typecheck hiện tại bỏ sót các config đang có lỗi

### Vị trí

- `tsconfig.json:63`
- `configs/playwright.base.config.ts:88–97`
- `.github/workflows/playwright.yml:90–158`

### Chưa ổn

`tsconfig.json` chỉ include `src/**/*`. Vì vậy `npm run typecheck` chưa bao phủ `playwright.config.ts` và `configs/**/*.ts`.

Khi dùng cùng compiler options và bổ sung các config vào danh sách kiểm tra, xuất hiện:

```text
configs/playwright.base.config.ts:91 — TS2322
configs/playwright.base.config.ts:94 — TS2769
```

Lỗi liên quan generic `createPlaywrightConfig<T>` và kiểu `use` sau khi merge base config với overrides.

Workflow hiện chưa có bước chạy typecheck. Playwright discovery thành công không thay thế kiểm tra kiểu đầy đủ.

### Hướng sửa

- Đưa root config và các file trong `configs/` vào phạm vi TypeScript.
- Sửa typing của config factory theo custom options thực tế; không chỉ ép kiểu để che lỗi.
- Thêm typecheck vào CI trước khi chạy tests.

### Tiêu chí hoàn tất

- [ ] Một lệnh typecheck bao phủ cả source và configs.
- [ ] Hai lỗi đã ghi nhận được xử lý.
- [ ] CI fail khi source hoặc config có lỗi TypeScript.

## R07 — P2: Helper tìm xuyên trang chưa thực hiện đúng contract

### Vị trí

- `src/infrastructure/ui/pages/cms/CMSAllProductsPage.ts:377–392`
- `src/infrastructure/helpers/common/collection/CollectionHelper.ts:367–407`

### Chưa ổn

`findRowByFiltersAcrossPages()` nhận nhiều filters và `options.maxPages`, nhưng:

1. Chỉ truyền `Object.keys(filters)[0]` và `Object.values(filters)[0]` xuống helper.
2. Bỏ qua `maxPages`.
3. Không truyền `goToFirstPage`, dù comment nói sẽ quay về trang đầu.

### Hậu quả

- Nhiều điều kiện lọc: có thể trả về dòng chỉ khớp điều kiện đầu tiên.
- Bắt đầu từ trang sau: có thể bỏ sót dữ liệu ở trang trước.
- Số trang trả về có thể không trùng số trang thực tế vì vòng lặp luôn bắt đầu đếm từ 1.
- Caller không kiểm soát được giới hạn scan đã yêu cầu.

### Hướng sửa

- Thực hiện đầy đủ tất cả filters và giới hạn số trang.
- Xác định rõ contract: luôn bắt đầu từ trang đầu hay scan từ trang hiện tại.
- Nếu chỉ hỗ trợ một field, đổi signature và tên method cho đúng thay vì nhận một object nhiều filters.

### Tiêu chí hoàn tất

- [ ] Có test nhiều filters với các dòng trùng một phần điều kiện.
- [ ] Có test bắt đầu từ trang khác trang 1.
- [ ] `maxPages` được thực thi hoặc được bỏ khỏi API nếu không hỗ trợ.

## R08 — P2: Test tạo sản phẩm chưa chứng minh đầy đủ kết quả nghiệp vụ

### Vị trí

- `src/presentation/tests/cms/products/ui/create.write.spec.ts:130–161`
- `src/infrastructure/data/cms/json/products.json:5`
- `src/infrastructure/data/common/TestDataRepository.ts:223–241`
- `src/infrastructure/ui/pages/cms/CMSAddNewProductPage.ts:382–385`

### Chưa ổn

- TC_03 lấy `getTestData('products', 'minimal')`, có tên cố định trong JSON; không thêm định danh duy nhất.
- Clone test data chỉ tách object trong bộ nhớ, không làm tên sản phẩm trên server trở thành unique.
- Các assertions chủ yếu xác nhận input đã được điền trước khi submit.
- `savePublish()` chỉ xác nhận redirect khỏi trang create sang URL products; chưa xác nhận sản phẩm vừa tạo tồn tại với đúng tên, giá và số lượng.
- Cleanup dữ liệu tạo được theo dõi tại R01.

### Hậu quả

- Chạy lại hoặc chạy nhiều project có thể tạo các sản phẩm trùng tên, gây khó xác định mục tiêu và cleanup.
- Backend lưu sai một số trường nhưng vẫn redirect thì các assertions hiện tại chưa phát hiện được sai lệch đó.

### Hướng sửa

- Giữ JSON làm template, override tên/SKU/định danh trước khi tạo.
- Sau submit, xác nhận đúng sản phẩm và các thuộc tính quan trọng từ UI hoặc API.
- Ưu tiên liên kết hậu kiểm và cleanup bằng ID vừa tạo.

### Tiêu chí hoàn tất

- [ ] Các create tests dùng dữ liệu định danh riêng.
- [ ] Test kiểm tra dữ liệu sau khi lưu, không chỉ trước khi submit và URL redirect.
- [ ] Sản phẩm tạo được liên kết rõ với cleanup của test.

---

## Các điểm nên làm gọn và nhất quán hơn

### C01 — P3: BasePage dùng chung phụ thuộc helper của CMS

**Vị trí:** `src/infrastructure/ui/pages/base/BasePage.ts:33–48`.

`BasePage` import và khởi tạo `BootstrapSelectHelper` cho mọi page, kể cả Neko. Phần dùng chung bị ràng buộc vào chi tiết của một domain.

**Đề xuất:** chuyển helper này vào CMS-specific base hoặc compose/inject tại những CMS page cần dùng. Base chung chỉ giữ năng lực thật sự dùng chung.

- [x] Common base không cần import helper riêng của CMS.

### C02 — P3: Form POM đã chia section về logic nhưng file vẫn quá lớn

**Vị trí:** `src/infrastructure/ui/pages/cms/CMSAddNewProductPage.ts` — 1.411 dòng tại thời điểm review, bao gồm comment.

Section delegation là hướng tốt, nhưng locators, section implementations, facade methods và tài liệu vẫn nằm trong một file lớn.

**Đề xuất:** tách section/component theo nhóm UI có trách nhiệm rõ, giữ page chính làm nơi điều phối. Không cần tách từng method thành file hay tạo thêm tầng chỉ để giảm số dòng.

- [x] Người sửa một section không phải đọc phần lớn file POM.
- [x] Public API của page/sections rõ, tránh hai cách gọi tương đương tràn lan nếu không cần tương thích ngược.

### C03 — P3: Comment hướng dẫn dài che khuất code chính

**Ví dụ:** `src/presentation/tests/cms/products/ui/create.write.spec.ts:1–83`.

Các banner, ví dụ và lịch sử debugging hữu ích cho tài liệu học tập, nhưng làm spec dài và khó quét nhanh. Một số comment lặp lại hành động mà tên method đã thể hiện.

**Đề xuất:** chuyển hướng dẫn dài sang `docs/` hoặc examples. Trong source giữ comment giải thích quyết định, constraint hoặc workaround thực sự cần biết.

- [x] Spec bắt đầu nhanh vào scenario và assertions.
- [x] Comment giải thích “vì sao”, không lặp lại “đang làm gì”.

### C04 — P3: Chưa có baseline lint/format và unused-symbol checks

**Vị trí:** `package.json:6–27`.

Chưa có script lint/format. Audit tùy chọn với `noUnusedLocals` và `noUnusedParameters` ghi nhận 13 diagnostics `TS6133`.

Ví dụ gồm import không dùng và các tham số đã được R07 ghi nhận là bị bỏ qua.

**Lưu ý:** đây là kiểm tra bổ sung, không phải lỗi của cấu hình typecheck hiện tại. Không nên coi mọi unused parameter đều chỉ là vấn đề format; cần kiểm tra xem nó có phản ánh chức năng chưa thực hiện hay không.

**Đề xuất:** thống nhất formatter/linter phù hợp với dự án, xử lý unused symbols và thêm quality checks vào CI. Trước khi cài dependency mới cần kiểm tra phiên bản, lockfile và môi trường hiện có.

- [x] Có lệnh kiểm tra style thống nhất.
- [x] Xử lý các unused diagnostics sau khi phân biệt dead code với phần chức năng còn thiếu.

### C05 — P3: Tài liệu/backlog không còn khớp code auth hiện tại

**Vị trí:**

- `AGENTS.md:78`
- `src/infrastructure/fixtures/neko/hybrid-auth.fixture.ts:96–109,214–227`

Backlog còn nói hybrid auth có fabricated-token fallback. Code hiện tại đã throw khi đăng ký/login thất bại hoặc không có access token.

**Không ghi nhận fake access-token fallback là lỗi hiện tại.** Điều này không đồng nghĩa toàn bộ auth flow đã được xác nhận đúng bằng E2E; chỉ là nhận định cụ thể trong backlog đã cũ.

**Đề xuất:** cập nhật tài liệu theo implementation thật, tránh người viết test mới hoặc reviewer tiếp tục dựa vào mô tả lỗi đã không còn đúng.

- [x] Backlog và hướng dẫn phản ánh đúng trạng thái auth hiện tại.

## Ghi chú về kiến trúc

Implementation hiện tại phù hợp với mô tả **layered automation framework dùng POM/AOM và fixture composition**.

Không cần thêm `domain/`, `application/`, interface hoặc service chỉ để khớp một sơ đồ Clean Architecture. Ưu tiên:

1. Dependency giữa common và domain đúng chiều.
2. Fixture API nhất quán và auth/role rõ ràng.
3. Helpers thực hiện đúng contract.
4. Spec thể hiện hành vi nghiệp vụ và kiểm tra kết quả thật.
5. Abstraction giải quyết nhu cầu thực, không chỉ đổi tên thao tác Playwright.

---

## Các kiểm tra đã thực hiện

### Môi trường cục bộ

- Node.js: `v24.15.0`.
- npm: `11.12.1`.
- Playwright đang cài: `1.63.0`.
- TypeScript đang cài: `5.9.3`.
- Không cài mới, nâng/hạ phiên bản hoặc thay đổi dependency.

### Kết quả

| Kiểm tra | Kết quả | Diễn giải |
| --- | --- | --- |
| `npm run typecheck` | Pass | Chỉ bao phủ phạm vi `include` hiện có. |
| Typecheck bổ sung root config và `configs/**/*.ts` | Fail | Hai lỗi TS2322/TS2769 tại base config. Không thay đổi tsconfig để thực hiện audit. |
| Discovery root và 4 standalone configs | Pass | Load được cấu hình và thu thập tests; không chứng minh E2E pass. |
| Audit `noUnusedLocals`/`noUnusedParameters` | 13 diagnostics | Kiểm tra tùy chọn, chưa phải baseline của dự án. |
| Tái hiện field mapping bằng source/resolver offline | Xác nhận lỗi | Field `type` không tồn tại trong mapping. |
| Kiểm tra device profile iPhone 12 | WebKit | Đối chiếu với workflow chỉ provision Chromium. |
| E2E lên hệ thống thật | Không chạy | Tránh tác động dữ liệu dùng chung trong lúc review. |
| Git status trước khi ghi tài liệu | Clean | Không có thay đổi source từ lượt review. |

## Thứ tự xử lý đề xuất

### Đợt 1 — Làm kết quả test đáng tin và kiểm soát dữ liệu

- [x] R01: Test-owned data và cleanup.
- [x] R02: Hậu kiểm delete, loại bỏ pass giả bằng log/return.
- [x] R08: Unique data và hậu kiểm dữ liệu sau create.

### Đợt 2 — Sửa lỗi thực thi và phạm vi kiểm tra

- [x] R03: Provision WebKit cho CMS mobile CI.
- [x] R04: Sửa product field mapping.
- [x] R05: Giới hạn root/cross-browser projects.
- [x] R06: Typecheck source + configs và tích hợp vào CI.
- [x] R07: Sửa contract tìm xuyên trang.

### Đợt 3 — Làm gọn và giữ chất lượng lâu dài

- [x] C01: Tách CMS helper khỏi common base.
- [x] C02: Tách section POM có chủ đích.
- [x] C03: Chuyển hướng dẫn dài khỏi source/spec.
- [x] C04: Thống nhất lint/format và xử lý unused symbols.
- [x] C05: Cập nhật backlog/tài liệu đã cũ.

**Điều kiện chốt cleanup:** typecheck toàn bộ xanh, discovery đúng phạm vi, helper có kiểm tra hồi quy và chạy các E2E liên quan trên môi trường được phép với dữ liệu test-owned. Không dùng việc “discovery pass” hoặc “report xanh” khi thiếu assertion để thay cho các điều kiện này.
