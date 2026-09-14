/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CMS — KIỂM TRA ĐĂNG NHẬP (UI TESTS)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tính năng: Trang đăng nhập CMS
 * URL: https://ecommerce.anhtester.com/login
 *
 * 📌 GHI CHÚ:
 * Dùng gatekeeper fixture để lấy loginPage (POM).
 * test.use({ storageState }) reset storage → page bắt đầu chưa đăng nhập.
 *
 * ⚠️ KHÔNG dùng dashboardPage fixture ở đây vì:
 * dashboardPage → cần authedPage → tự auto-login → xung đột với login test.
 * Thay vào đó, verify đăng nhập thành công bằng URL.
 */

import { test } from '@fixtures/cms';
import { getTestData } from '@data/common/TestDataRepository';

// Reset storage để đảm bảo mỗi test chạy sạch sẽ (chưa đăng nhập)
test.use({ storageState: { cookies: [], origins: [] } });

// Lấy dữ liệu test từ TestDataRepository
const validCredentials = getTestData('login', 'validCredentials');
const negativeTestCases = getTestData('login', 'negativeTestCases');

// ═══════════════════════════════════════════════════════════════════════════
// 📍 KIỂM TRA ĐĂNG NHẬP — Happy Path
// ═══════════════════════════════════════════════════════════════════════════

test.describe('CMS Đăng nhập', { tag: '@smoke' }, () => {

  test('TC_01: Đăng nhập thành công với thông tin hợp lệ', async ({ loginPage }) => {
    await loginPage.login(validCredentials.email, validCredentials.password);
    await loginPage.expectLoggedIn();
  });

  test('TC_02: Hiển thị đầy đủ các phần tử trang đăng nhập', async ({ loginPage }) => {
    await loginPage.expectOnPage();
  });

  test('TC_03: Đăng nhập với tùy chọn "Nhớ mật khẩu"', async ({ loginPage }) => {
    await loginPage.login(validCredentials.email, validCredentials.password, true);
    await loginPage.expectLoggedIn();
  });

  test('TC_04: Điều hướng tới trang quên mật khẩu', async ({ loginPage }) => {
    await loginPage.clickForgotPassword();
    await loginPage.expectOnForgotPasswordPage();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 📍 KIỂM TRA ĐĂNG NHẬP THẤT BẠI — Parameterized Negative Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('CMS Đăng nhập thất bại', { tag: '@regression' }, () => {

  for (const testCase of negativeTestCases) {
    test(testCase.testName, async ({ loginPage }) => {
      await loginPage.login(testCase.email, testCase.password);

      if (testCase.validationType === 'field') {
        // Field validation — server trả về is-invalid class trên input
        await loginPage.expectFieldValidationError(testCase.email, testCase.password);
      } else if (testCase.validationType === 'browser') {
        // Browser validation — HTML5 type="email" ngăn submit (invalid format)
        await loginPage.expectStillOnLoginPage();
      } else if (testCase.validationType === 'server') {
        // Toast notification — thông báo lỗi credentials
        await loginPage.expectErrorNotification(testCase.expectedError);
        await loginPage.expectStillOnLoginPage();
      }
    });
  }
});
