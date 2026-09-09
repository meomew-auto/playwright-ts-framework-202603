import { test, expect } from "@fixtures/neko";
import { getTestData, getTestCases } from "@data";

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 🧪 DATA CATALOG ENGINE & SUPER APP GATEKEEPER INTEGRATION SPEC
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Kiểm chứng sự kết hợp hoàn hảo giữa 2 siêu vũ khí:
 * 1. Zod-Validated Test Data Catalog (@data):
 *    - Đọc file JSON (orders, products, login, customer)
 *    - Thẩm định Zod Schema runtime, không lo gõ sai chính tả
 *    - Hỗ trợ deep clone, overrides và transform
 *    - Hỗ trợ getTestCases() sinh data-driven test cases
 * 2. Hybrid Super App Gatekeeper Fixture (@fixtures/neko):
 *    - Cung cấp đồng thời cả UI Page Objects (loginPage, adminOrdersPage...)
 *    - Cung cấp đồng thời cả API AOM Clients (authedStaffClient, productApi...)
 *    - Xác thực siêu tốc 0ms RAM Snapshot
 */

test.describe("📦 [DATA ENGINE & SUPER APP] Kiểm Chứng Dữ Liệu File UI & Super Gatekeeper", () => {
  // ──────────────────────────────────────────────────────────
  // 1. KIỂM THỬ ZOD DATA CATALOG TỪ FILE CHO UI
  // ──────────────────────────────────────────────────────────
  test("01 - [DATA CATALOG] Lấy dữ liệu đơn hàng Neko từ file JSON kèm Zod Validation", async () => {
    // Lấy dữ liệu đơn hàng chuẩn từ file orders.json
    const deliveredOrder = getTestData("nekoOrders", "deliveredOrder");
    expect(deliveredOrder.orderCode).toBe("#B2C-20260210-4528");
    expect(deliveredOrder.status).toBe("Đã giao hàng");
    expect(deliveredOrder.totalAmount).toBe("380.000đ");

    console.log(`✅ [Data Catalog] Đọc thành công đơn hàng: ${deliveredOrder.orderCode}`);
  });

  test("02 - [DATA OVERRIDES] Ghi đè thuộc tính dữ liệu sản phẩm an toàn (Deep Clone)", async () => {
    // Lấy dữ liệu sản phẩm gốc
    const originalBean = getTestData("nekoProducts", "arabicaBeans");
    expect(originalBean.price).toBe(280000);

    // Lấy dữ liệu sản phẩm có override giá và tên
    const customBean = getTestData("nekoProducts", "arabicaBeans", {
      overrides: {
        price: 320000,
        name: "Arabica Cầu Đất Thượng Hạng 2026",
      },
    });
    expect(customBean.price).toBe(320000);
    expect(customBean.name).toBe("Arabica Cầu Đất Thượng Hạng 2026");

    // Đảm bảo không bị mutate dữ liệu gốc trong catalog
    expect(originalBean.price).toBe(280000);
    console.log("✅ [Data Overrides] Ghi đè giá thành công mà không làm thay đổi Catalog gốc!");
  });

  test("03 - [DATA TRANSFORM] Biến đổi cấu trúc mảng dữ liệu qua transform function", async () => {
    // Lấy danh sách cases và transform trích xuất danh sách key
    const transformedSummary = getTestData("nekoOrders", "deliveredOrder", {
      transform: (order) => ({
        code: order.orderCode,
        isSuccess: order.status === "Đã giao hàng",
      }),
    });

    expect(transformedSummary.code).toBe("#B2C-20260210-4528");
    expect(transformedSummary.isSuccess).toBe(true);
    console.log("✅ [Data Transform] Biến đổi dữ liệu thành công:", transformedSummary);
  });

  test("04 - [DATA-DRIVEN GENERATION] Lấy toàn bộ cases bằng getTestCases()", async () => {
    const orderCases = getTestCases("nekoOrders");
    expect(orderCases.length).toBeGreaterThanOrEqual(3);

    for (const testCase of orderCases) {
      expect(testCase.key).toBeDefined();
      expect(testCase.description).toBeDefined();
      expect(testCase.data.orderCode).toBeDefined();
    }

    console.log(`✅ [Data Driven] Đã trích xuất ${orderCases.length} kịch bản test case từ file JSON!`);
  });

  // ──────────────────────────────────────────────────────────
  // 2. KIỂM THỬ SUPER APP GATEKEEPER FIXTURE (HỢP NHẤT UI + API)
  // ──────────────────────────────────────────────────────────
  test("05 - [SUPER APP GATEKEEPER] Phối hợp đồng thời UI Page Objects & Authed API Client", async ({
    loginPage,
    adminOrdersPage,
    authedStaffClient,
    workerStaffSnapshot,
  }) => {
    console.log("🚀 [Super Gatekeeper] Bắt đầu kiểm chứng tích hợp UI POM + API AOM...");

    // 1. Kiểm tra Worker RAM Snapshot 0ms
    expect(workerStaffSnapshot.token).toBeDefined();
    expect(workerStaffSnapshot.user.role).toBe("staff");
    console.log(`⚡ [RAM Snapshot] Token Staff sẵn sàng trong RAM: ${workerStaffSnapshot.email}`);

    // 2. Kiểm tra API AOM Client đã gắn sẵn auth token
    const meRes = await authedStaffClient.authApi.getMe();
    expect(meRes.status()).toBe(200);
    const meData = await meRes.json();
    expect(meData.role).toBe("staff");

    const productsRes = await authedStaffClient.productApi.getProducts({ page: 1, limit: 5 });
    expect(productsRes.status()).toBe(200);
    const productsData = await productsRes.json();
    expect(Array.isArray(productsData.data)).toBe(true);
    console.log(`📦 [API AOM] Đã gọi API qua authedStaffClient, nhận được ${productsData.data.length} items!`);

    // 3. Kiểm tra UI Page Objects đã được inject tự động (không cần new thủ công)
    expect(loginPage).toBeDefined();
    expect(adminOrdersPage).toBeDefined();
    console.log("🖥️ [UI POM] loginPage và adminOrdersPage đã sẵn sàng nhận lệnh tương tác!");

    console.log("🏆 [SUPER APP PASSED] Toàn bộ hạ tầng Super Gatekeeper UI + API hoạt động trơn tru!");
  });
});
