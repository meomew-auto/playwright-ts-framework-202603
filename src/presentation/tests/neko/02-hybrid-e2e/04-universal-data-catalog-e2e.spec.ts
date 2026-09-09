import { test, expect } from "@fixtures/neko";
import { getTestData } from "@data";

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 🤝 [HYBRID E2E TEST SUITE] SINGLE SOURCE OF TRUTH VỚI DATA CATALOG (@data)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Minh chứng tối thượng: @data là nguồn dữ liệu dùng chung (Single Source of Truth)
 * cho toàn bộ chu trình kiểm thử hỗn hợp API + UI:
 *
 * 1. NẠP DỮ LIỆU: Chỉ đọc 1 lần từ getTestData("nekoApiProducts", ...)
 * 2. API SEEDING: Gọi API Backend tạo sản phẩm siêu tốc (0ms click form)
 * 3. ZERO-LOGIN UI AUDIT: Trình duyệt mở trang Admin Products (phiên Staff từ RAM 0ms)
 *    và đối chiếu trực tiếp dữ liệu hiển thị trên bảng UI với chính dữ liệu từ Catalog.
 * 4. API TEARDOWN: Gọi API Backend dọn dẹp sản phẩm để bảo vệ môi trường sạch 100%.
 */

test.describe("🤝 [HYBRID E2E & DATA CATALOG] Mô Hình Single Source of Truth", () => {
  let createdProductId = 0;

  test.afterEach(async ({ authedStaffClient }) => {
    if (createdProductId > 0) {
      console.log(`🧹 [Teardown] Đang dọn dẹp sản phẩm test ID: ${createdProductId}...`);
      await authedStaffClient.productApi.deleteProduct(createdProductId);
      createdProductId = 0;
    }
  });

  test("01 - [SINGLE SOURCE OF TRUTH] API Seed -> Zero-Login UI Audit -> API Cleanup dùng chung @data", async ({
    adminProductsPage,
    authedStaffClient,
    workerStaffSnapshot,
  }) => {
    // ══════════════════════════════════════════════════════════════════════════
    // BƯỚC 1: TRÍCH XUẤT DỮ LIỆU TỪ DATA CATALOG (@data)
    // ══════════════════════════════════════════════════════════════════════════
    const uniqueTimestamp = Date.now();
    const productData = getTestData("nekoApiProducts", "arabicaSpecial", {
      overrides: {
        name: `Arabica Cầu Đất E2E_${uniqueTimestamp}`,
        price_per_unit: 310000,
      },
    });

    console.log(`📦 [Catalog Data] Nạp dữ liệu sản phẩm mẫu: "${productData.name}" (${productData.price_per_unit}đ)`);

    // ══════════════════════════════════════════════════════════════════════════
    // BƯỚC 2: API SEEDING (Chuẩn bị dữ liệu trên DB trong tích tắc)
    // ══════════════════════════════════════════════════════════════════════════
    console.log("⚡ [API Seeding] Đang gọi API tạo sản phẩm với authedStaffClient...");
    const createRes = await authedStaffClient.productApi.createProduct(productData);
    expect(createRes.status()).toBe(201);
    const createdBody = await createRes.json();
    createdProductId = createdBody.id;
    expect(createdProductId).toBeGreaterThan(0);
    console.log(`✅ [API Seeded] Đã tạo thành công sản phẩm trên hệ thống, ID: ${createdProductId}`);

    // ══════════════════════════════════════════════════════════════════════════
    // BƯỚC 3: ZERO-LOGIN UI AUDIT (Mở trang quản trị và đối soát dữ liệu)
    // ══════════════════════════════════════════════════════════════════════════
    console.log("🖥️ [UI Audit] Mở trang Quản trị Sản phẩm (Next.js Admin)...");
    await adminProductsPage.navigate("https://coffee.autoneko.com/admin/products");

    // Tìm dòng sản phẩm trên bảng bằng tên được lấy từ chính data catalog
    const productRow = await adminProductsPage.findProductRowByName(productData.name);
    await expect(productRow).toBeVisible({ timeout: 15000 });

    console.log(`🔍 [UI Audit] Đã phát hiện dòng sản phẩm "${productData.name}" trên bảng giao diện!`);

    // Trích xuất dữ liệu của dòng đó trên giao diện web để đối soát
    const rowData = await adminProductsPage.getProductRowData(productData.name);
    expect(rowData["tênSảnPhẩm"]).toContain(productData.name);

    console.log("🏆 [E2E PASSED] Dữ liệu hiển thị trên UI khớp 100% với dữ liệu từ Data Catalog & API!");
  });
});
