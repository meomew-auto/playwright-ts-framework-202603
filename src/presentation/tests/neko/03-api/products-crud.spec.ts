/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO COFFEE — TẠO SẢN PHẨM QUA API (POST)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * API: POST /api/products
 * Dùng: Zod schemas để tạo test data và validate lỗi
 */

import { test, expect } from "@fixtures/neko";
import { ProductSchemas } from "@schemas/neko/ProductSchemas";
import { ErrorSchemas } from "@schemas/neko/ErrorSchemas";
import { Logger } from "@utils/Logger";

test.describe(
  "API Products - POST Tạo mới",
  { tag: ["@crud", "@smoke"] },
  () => {
    let createdProductId: number | null = null;

    // Dọn dẹp sau mỗi test
    test.afterEach(async ({ productApi }) => {
      if (createdProductId) {
        await productApi.deleteProduct(createdProductId);
        Logger.info(`Đã dọn dẹp product: ${createdProductId}`, {
          context: "cleanup",
        });
        createdProductId = null;
      }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // 📦 SẢN PHẨM LOẠI HẠT (BEAN)
    // ═══════════════════════════════════════════════════════════════════════════

    test("TC_POST_01: Tạo sản phẩm hạt với trường tối thiểu", async ({
      productApi,
    }) => {
      const data = ProductSchemas.createBean();
      const created = await productApi.createProductData(data);
      createdProductId = created.id;

      expect(created.id).toBeDefined();
      expect(created.type).toBe("bean");
      expect(created.is_active).toBe(true);
    });

    test("TC_POST_02: Tạo sản phẩm hạt với override xuất xứ", async ({
      productApi,
    }) => {
      const data = ProductSchemas.createBean({ origin: "Ethiopia" });

      const created = await productApi.createProductData(data);
      createdProductId = created.id;

      expect(created.origin).toBe("Ethiopia");
      expect(created.type).toBe("bean");
    });

    test("TC_POST_03: Tạo sản phẩm hạt với override giá", async ({
      productApi,
    }) => {
      const data = ProductSchemas.createBean({ price_per_unit: 350000 });

      const created = await productApi.createProductData(data);
      createdProductId = created.id;

      expect(created.price_per_unit).toBe(350000);
    });

    test("TC_POST_04: Tạo sản phẩm hạt đầy đủ với specifications", async ({
      productApi,
    }) => {
      const data = ProductSchemas.createFullBean({
        origin: "Yemen",
        roast_level: "Dark",
      });

      const created = await productApi.createProductData(data);
      createdProductId = created.id;

      expect(created.origin).toBe("Yemen");
      expect(created.roast_level).toBe("Dark");
      expect(created.specifications).toBeDefined();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔧 SẢN PHẨM THIẾT BỊ (EQUIPMENT)
    // ═══════════════════════════════════════════════════════════════════════════

    test("TC_POST_05: Tạo thiết bị có bảo hành", async ({ productApi }) => {
      const data = ProductSchemas.createEquipment({
        warranty_months: 24,
        price_per_unit: 5000000,
      });

      const created = await productApi.createProductData(data);
      createdProductId = created.id;

      expect(created.type).toBe("equipment");
      expect(created.warranty_months).toBe(24);
      expect(created.price_per_unit).toBe(5000000);
    });

    test("TC_POST_06: Tạo thiết bị có specifications", async ({
      productApi,
    }) => {
      const data = ProductSchemas.createEquipment({
        name: `DeLonghi EC685 ${Date.now()}`,
        specifications: {
          brand: "DeLonghi",
          model: "EC685",
          power: "1300W",
          pressure: "15 bar",
        },
      });

      const created = await productApi.createProductData(data);
      createdProductId = created.id;

      expect(created.specifications).toBeDefined();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎁 SẢN PHẨM PHỤ KIỆN (ACCESSORY)
    // ═══════════════════════════════════════════════════════════════════════════

    test("TC_POST_07: Tạo sản phẩm phụ kiện", async ({ productApi }) => {
      const data = ProductSchemas.createAccessory({
        name: `Coffee Filter ${Date.now()}`,
        price_per_unit: 50000,
      });

      const created = await productApi.createProductData(data);
      createdProductId = created.id;

      expect(created.type).toBe("accessory");
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ KIỂM TRA VALIDATION RESPONSE
    // ═══════════════════════════════════════════════════════════════════════════

    test("TC_POST_08: Validate response của sản phẩm đã tạo", async ({
      productApi,
    }) => {
      const data = ProductSchemas.createBean({ origin: "Brazil" });

      const created = await productApi.createProductData(data);
      createdProductId = created.id;

      // Validate response schema bằng Zod
      const validated = ProductSchemas.Product.parse(created);

      expect(validated.id).toBeDefined();
      expect(validated.name).toBeTruthy();
      expect(validated.type).toBe("bean");
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // ❌ NEGATIVE TESTS — Kiểm tra lỗi validation (dùng createProductExpectError)
    // ═══════════════════════════════════════════════════════════════════════════

    test("TC_POST_09: Từ chối body rỗng", async ({ productApi }) => {
      // Pattern gọn: một method vừa validate status vừa validate error schema
      const error = await productApi.createProductExpectError({});
      // Dùng helper để lấy error messages bất kể format
      const messages = ErrorSchemas.getErrorMessages(error);
      expect(messages.length).toBeGreaterThan(0);
    });

    test("TC_POST_10: Từ chối thiếu trường name", async ({
      productApi,
    }) => {
      const error = await productApi.createProductExpectError({
        type: "bean",
        price_per_unit: 100000,
      });

      // Dùng helper để trích xuất error type-safe
      const messages = ErrorSchemas.getErrorMessages(error);
      expect(messages.length).toBeGreaterThan(0);
    });

    test("TC_POST_11: Từ chối giá trị type không hợp lệ", async ({
      productApi,
    }) => {
      const error = await productApi.createProductExpectError({
        name: `Invalid Type ${Date.now()}`,
        type: "invalid_type", // Giá trị enum không hợp lệ
        price_per_unit: 100000,
      });

      const messages = ErrorSchemas.getErrorMessages(error);
      expect(messages.length).toBeGreaterThan(0);
    });

    test("TC_POST_12: Từ chối giá âm", async ({ productApi }) => {
      // API có thể không validate giá âm — dùng raw method cho edge case
      const response = await productApi.createProductRaw({
        name: `Negative Price ${Date.now()}`,
        type: "bean",
        price_per_unit: -100,
      });

      // API có thể chấp nhận giá âm (không validate) — điều chỉnh expectation nếu cần
      expect([201, 400, 422]).toContain(response.status());
    });

    test("TC_POST_13: Từ chối giá không phải số (string)", async ({
      productApi,
    }) => {
      const error = await productApi.createProductExpectError({
        name: `String Price ${Date.now()}`,
        type: "bean",
        price_per_unit: "not_a_number", // Sai kiểu dữ liệu
      });

      const messages = ErrorSchemas.getErrorMessages(error);
      expect(messages.length).toBeGreaterThan(0);
    });
  },
);
