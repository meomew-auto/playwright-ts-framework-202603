import { test, expect } from "@fixtures/neko";

test.describe("👑 [HYBRID AUTH] Admin RAM Snapshot Verification (0ms)", () => {
  test("01 - [ADMIN RAM SNAPSHOT] Xác thực WorkerAdminSnapshot nạp thành công quyền Admin trong RAM", async ({
    workerAdminSnapshot,
    adminToken,
    authedAdminClient,
  }) => {
    // 1. Thẩm định Token & User Profile trong RAM
    expect(workerAdminSnapshot.token).toBeTruthy();
    expect(workerAdminSnapshot.user.role).toBe("admin");
    expect(adminToken).toBe(workerAdminSnapshot.token);

    // 2. Thẩm định gọi API với authedAdminClient
    const meRes = await authedAdminClient.authApi.getMe();
    expect(meRes.status()).toBe(200);
    const me = await meRes.json();
    expect(me.role).toBe("admin");

    console.log(
      `👑 [Admin RAM Snapshot] Verified Admin Token in RAM: ${me.email}, role: ${me.role}`,
    );
  });

  test("02 - [ADMIN PAGE INJECTION] adminPage tiêm sẵn phiên Admin trực tiếp qua addInitScript (0ms)", async ({
    adminPage,
    workerAdminSnapshot,
  }) => {
    await adminPage.goto("https://coffee.autoneko.com/en");

    // Thẩm định localStorage đã nhận đúng token admin
    const storedToken = await adminPage.evaluate(() =>
      localStorage.getItem("access_token"),
    );
    expect(storedToken).toBe(workerAdminSnapshot.token);

    const rawNekoAuth = await adminPage.evaluate(() =>
      localStorage.getItem("neko_auth"),
    );
    const nekoAuth = JSON.parse(rawNekoAuth || "{}");
    expect(nekoAuth.state.isAuthenticated).toBe(true);
    expect(nekoAuth.state.user.role).toBe("admin");

    console.log(
      `🚀 [Admin Page] Trình duyệt nhận phiên Admin tự động qua addInitScript (0ms), role: ${nekoAuth.state.user.role}`,
    );
  });
});
