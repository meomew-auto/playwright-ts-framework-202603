import { test, expect } from "@fixtures/neko";
import { getTestData, getTestCases } from "@data";
import { Logger } from "@utils/Logger";

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 🌐 [API TEST SUITE] KIỂM THỬ TẦNG API DÙNG DỮ LIỆU TỪ DATA CATALOG (@data)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Minh chứng sống động: Tầng @data hoàn toàn phục vụ xuất sắc cho API Tests:
 * 1. Test 01: Lấy Payload từ JSON Catalog (đã qua Zod validation) để gọi POST /api/products.
 * 2. Test 02: Ghi đè (overrides) an toàn thuộc tính payload mà không ảnh hưởng Catalog gốc.
 * 3. Test 03: Sinh test cases tự động (Data-Driven Testing) từ getTestCases("nekoApiProducts").
 */

test.describe("🌐 [API & DATA CATALOG] Kiểm Thử API Sử Dụng @data", () => {
  const createdProductIds: number[] = [];

  // Dọn dẹp tài nguyên sau mỗi kịch bản test
  test.afterEach(async ({ productApi }) => {
    for (const id of createdProductIds) {
      try {
        await productApi.deleteProduct(id);
        Logger.info(`[TEARDOWN] Đã dọn dẹp sản phẩm ID: ${id}`);
      } catch (err) {
        // Bỏ qua lỗi dọn dẹp nếu sản phẩm đã bị xóa trước đó
      }
    }
    createdProductIds.length = 0;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. GỌI API VỚI PAYLOAD TỪ DATA CATALOG (JSON + ZOD VALIDATION)
  // ──────────────────────────────────────────────────────────────────────────
  test("01 - [API POST WITH CATALOG] Tạo sản phẩm từ payload mẫu trong JSON Catalog", async ({
    productApi,
  }) => {
    // 1. Trích xuất payload đã qua Zod validation từ Data Catalog
    const payload = getTestData("nekoApiProducts", "arabicaSpecial", {
      overrides: {
        name: `Arabica_Catalog_${Date.now()}`,
      },
    });

    console.log(`📦 [Data Catalog] Đã nạp payload API cho sản phẩm: "${payload.name}"`);

    // 2. Gửi request POST tới API Endpoint
    const created = await productApi.createProductData(payload);
    createdProductIds.push(created.id);

    // 3. Thẩm định kết quả trả về khớp 100% với dữ liệu từ Catalog
    expect(created.id).toBeDefined();
    expect(created.name).toBe(payload.name);
    expect(created.price_per_unit).toBe(payload.price_per_unit);
    expect(created.type).toBe(payload.type);
    expect(created.origin).toBe(payload.origin);

    console.log(
      `✅ [API Passed] Đã tạo thành công sản phẩm từ Data Catalog ID: ${created.id} (Giá: ${created.price_per_unit}đ)`
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. GỌI API VỚI DỮ LIỆU ĐƯỢC GHI ĐÈ (OVERRIDES) AN TOÀN
  // ──────────────────────────────────────────────────────────────────────────
  test("02 - [API OVERRIDES] Ghi đè giá và xuất xứ khi gọi API mà không làm bẩn Catalog gốc", async ({
    productApi,
  }) => {
    const originalMachine = getTestData("nekoApiProducts", "espressoMachinePro");

    // Lấy payload có overrides giá và mô tả
    const customPayload = getTestData("nekoApiProducts", "espressoMachinePro", {
      overrides: {
        name: `Máy Pha Cafe Pro VIP_${Date.now()}`,
        price_per_unit: 14500000,
        origin: "Italy - Special Edition",
      },
    });

    const created = await productApi.createProductData(customPayload);
    createdProductIds.push(created.id);

    expect(created.price_per_unit).toBe(14500000);
    expect(created.origin).toBe("Italy - Special Edition");

    // Khẳng định dữ liệu gốc trong Catalog vẫn giữ nguyên vẹn
    expect(originalMachine.price_per_unit).toBe(12500000);
    expect(originalMachine.origin).toBe("Ý");

    console.log("✅ [API Overrides Passed] Dữ liệu tạo mới chuẩn xác và Catalog gốc được bảo toàn!");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. DATA-DRIVEN API TESTING: SINH TEST CASES TỰ ĐỘNG TỪ CATALOG
  // ──────────────────────────────────────────────────────────────────────────
  test("03 - [API DATA-DRIVEN] Sinh và thực thi hàng loạt API payloads từ getTestCases()", async ({
    productApi,
  }) => {
    const testCases = getTestCases("nekoApiProducts");
    expect(testCases.length).toBeGreaterThanOrEqual(3);

    for (const tc of testCases) {
      const dynamicPayload = {
        ...tc.data,
        name: `${tc.data.name}_DD_${Date.now()}`,
      };

      const created = await productApi.createProductData(dynamicPayload);
      createdProductIds.push(created.id);

      expect(created.id).toBeGreaterThan(0);
      expect(created.type).toBe(tc.data.type);
      console.log(`✅ [Data-Driven API] Passed case "${tc.description}" -> Created ID: ${created.id}`);
    }
  });
});
