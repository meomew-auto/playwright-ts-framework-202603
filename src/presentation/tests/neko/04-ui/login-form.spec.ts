/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ☕ NEKO COFFEE — FORM ĐĂNG NHẬP (UI TESTS)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tính năng: Màn hình Đăng nhập (Next.js SPA)
 * URL: https://coffee.autoneko.com/login  →  server redirect sang /vi/login
 * Loại: Chỉ đọc (read-only) — chỉ tạo phiên trong RAM/localStorage, tự dọn dẹp
 *
 * 🎯 CÁC "ENTERPRISE HYBRID E2E MODELS" ĐƯỢC ÁP DỤNG:
 * - Model 2 (UI Action ➔ API Integrity Check): Assert localStorage token TRÙNG
 *   với `access_token` mà backend trả về → chống "Optimistic UI" giả thành công.
 * - Model 4 (Reverse Network Audit + Zod Validation): Bắt response
 *   `POST /auth/login` do hành động UI phát ra và thẩm định bằng Zod schema
 *   (`ErrorSchemas.ApiError` cho 401, `authTokenResponseSchema` cho 200).
 * - Model 5 (Zero-Pollution Auto-Teardown): Dọn phiên đăng nhập trong `finally`.
 *
 * ⚠️ ĐẶC THÙ CỦA SITE (đã khảo sát trực tiếp môi trường LIVE):
 * - Đăng nhập THÀNH CÔNG thì SPA **KHÔNG redirect** — vẫn ở `/vi/login` và chỉ
 *   đổi trạng thái Header → TUYỆT ĐỐI không assert URL để kết luận login thành công.
 * - Trang có 3 nút `button[type=submit]` ⇒ luôn bám `data-testid` (POM đã xử lý).
 * - Copy trên UI ("Tên đăng nhập hoặc mật khẩu không đúng.") KHÁC message của
 *   backend ("Sai tên đăng nhập hoặc mật khẩu") → spec assert cả hai.
 *
 * 🧪 SMOKE COMMAND:
 * npx playwright test src/presentation/tests/neko/04-ui/login-form.spec.ts --project=neko-ui
 */

import { test, expect } from "@fixtures/neko";
import { EnvManager } from "@utils/EnvManager";
import {
  NEKO_ACCESS_TOKEN_KEY,
  NEKO_AUTH_LOGIN_ENDPOINT,
  NEKO_LOGIN_ERROR_MESSAGE,
} from "@pages/neko/NekoLoginPage";
import { ErrorSchemas, authTokenResponseSchema } from "@schemas/neko";

test.describe("🔐 Đăng nhập Neko Coffee @auth @read", () => {
  // ⏱️ Nâng budget lên 60s cho suite này: các test thực thi thật với backend LIVE
  // (login POST) và chạy song song nhiều worker (fullyParallel) nên cần dư địa hơn
  // mặc định 30s. TUYỆT ĐỐI KHÔNG dùng waitForTimeout — chỉ nới timeout của runner.
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 📍 TC_01 — UI CONTRACT CỦA FORM ĐĂNG NHẬP
  // ═════════════════════════════════════════════════════════════════════════

  test("TC_01: Form đăng nhập render đúng UI contract (heading, 2 trường bắt buộc, nút submit, phiên khách)", async ({
    loginPage,
  }) => {
    // Heading H1 + mô tả phụ + placeholder + required + masking mật khẩu + nhãn nút
    await loginPage.expectLoginFormContract();

    // Ngữ cảnh khách sạch: Header còn "Đăng nhập"/"Đăng ký", chưa có "Quản lý"/"Đăng xuất"
    await loginPage.expectGuestHeaderState();

    // Chưa đăng nhập ⇒ KHÔNG được có token trong localStorage
    expect(await loginPage.getStoredAccessToken()).toBeNull();
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 📍 TC_02 — ĐĂNG NHẬP THẤT BẠI (REVERSE NETWORK AUDIT + ZOD 401)
  // ═════════════════════════════════════════════════════════════════════════

  test("TC_02: Đăng nhập sai thông tin → API 401 (Zod ApiError) + dialog 'Đăng nhập thất bại' + có thể thử lại", async ({
    loginPage,
  }) => {
    const timestamp = Date.now();
    const invalidUsername = `probe_user_${timestamp}`;
    const invalidPassword = `Wrong_${timestamp}!`;

    // 🎯 Model 4: bắt đúng response POST /auth/login do hành động UI phát ra
    const response = await loginPage.loginAndCaptureResponse(
      invalidUsername,
      invalidPassword,
    );

    // ── 1. Tầng HTTP: phải bị từ chối bằng 401 ────────────────────────────
    expect(response.url()).toContain(NEKO_AUTH_LOGIN_ENDPOINT);
    expect(
      response.status(),
      "❌ Backend phải từ chối thông tin đăng nhập sai bằng HTTP 401",
    ).toBe(401);

    // ── 2. Tầng Contract: thẩm định body lỗi bằng Zod ─────────────────────
    const errorBody = ErrorSchemas.ApiError.parse(await response.json());
    expect(errorBody.status).toBe(401);
    expect(errorBody.code).toBe("UNAUTHORIZED");
    expect(errorBody.message).toMatch(/Sai tên đăng nhập hoặc mật khẩu/i);
    console.log(`🛡️ [Zod ApiError] ${errorBody.code}: ${errorBody.message}`);

    // ── 3. Tầng UI: dialog lỗi hiển thị đúng copy người dùng nhìn thấy ────
    await loginPage.expectLoginFailureDialog(NEKO_LOGIN_ERROR_MESSAGE);

    // ── 4. Không được rò rỉ token khi đăng nhập thất bại ──────────────────
    expect(await loginPage.getStoredAccessToken()).toBeNull();

    // ── 5. Đóng dialog → form sẵn sàng cho lần thử tiếp theo ──────────────
    await loginPage.closeFailureDialog();
    await loginPage.expectLoginRetryReady(`retry_${Date.now()}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 📍 TC_03 — SUBMIT RỖNG (CLIENT-SIDE VALIDATION, KHÔNG GỌI API)
  // ═════════════════════════════════════════════════════════════════════════

  test("TC_03: Submit form rỗng → HTML5 required chặn tại client, KHÔNG phát sinh request /auth/login", async ({
    loginPage,
  }) => {
    // Bắt đầu theo dõi network TRƯỚC khi bấm nút
    const loginRequests = loginPage.trackLoginRequests();

    await loginPage.submit();

    // Cả 2 trường đều invalid với native validationMessage
    await loginPage.expectRequiredValidationBlocked();

    // Bằng chứng mạnh nhất: KHÔNG có request nào bay lên backend
    loginPage.expectNoLoginRequestFired(loginRequests);

    // Và dĩ nhiên không có dialog lỗi nào (lỗi bị chặn ở client)
    await loginPage.expectNoFailureDialog();
    expect(await loginPage.getStoredAccessToken()).toBeNull();
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 📍 TC_04 — ĐĂNG NHẬP THÀNH CÔNG (ZOD 200 + INTEGRITY CHECK + TEARDOWN)
  // ═════════════════════════════════════════════════════════════════════════

  test("TC_04: Đăng nhập Admin thành công → API 200 (Zod AuthTokenResponse), Header đổi trạng thái và token lưu đúng vào localStorage", async ({
    loginPage,
  }) => {
    const username = EnvManager.get("NEKO_ADMIN_USERNAME");
    const password = EnvManager.get("NEKO_ADMIN_PASSWORD");

    // 🎯 Model 4: bắt response đăng nhập thành công
    const response = await loginPage.loginAndCaptureResponse(username, password);

    expect(
      response.status(),
      "❌ Đăng nhập bằng tài khoản Admin hợp lệ phải trả HTTP 200",
    ).toBe(200);

    // ── 1. Contract: body 200 phải khớp Zod AuthTokenResponse ─────────────
    const parsed = authTokenResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new Error(
        `❌ Response 200 vi phạm contract 'authTokenResponseSchema': ${JSON.stringify(
          parsed.error.issues,
        )}`,
      );
    }
    const authToken = parsed.data;
    expect(authToken.access_token).toBeTruthy();
    expect(authToken.token_type).toBeTruthy();
    expect(authToken.user?.username).toBe(username);
    console.log(
      `🛡️ [Zod AuthTokenResponse] ${authToken.token_type} token cho '${authToken.user?.username}' (role: ${authToken.user?.role})`,
    );

    try {
      // ── 2. Tầng UI: SPA KHÔNG redirect, Header đổi sang trạng thái đã xác thực
      await loginPage.expectLoginSucceeded(username);

      // ── 3. → Model 2: Integrity Check (chống "Optimistic UI" giả thành công)
      //     Token mà UI lưu phải TRÙNG CHÍNH XÁC token backend cấp.
      const storedToken = await loginPage.getStoredAccessToken();
      expect(storedToken, "❌ localStorage phải lưu access_token sau khi đăng nhập").toBeTruthy();
      expect(
        storedToken,
        `❌ Token trong localStorage.${NEKO_ACCESS_TOKEN_KEY} KHÔNG khớp token backend trả về`,
      ).toBe(authToken.access_token);
      console.log("✅ [Integrity] localStorage token khớp 100% với backend.");
    } finally {
      // ── 4. Model 5: Zero-Pollution Teardown — không để lại phiên đăng nhập
      await loginPage.clearStoredSession();
    }
  });
});
