/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 📦 UNIVERSAL TEST DATA CATALOG ENGINE (CLEAN ARCHITECTURE)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Trung tâm điều phối dữ liệu kiểm thử (JSON) cho toàn bộ UI và API.
 *
 * 🎯 NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Zod Runtime Validation: Toàn bộ JSON được parse và thẩm định ngay khi module nạp.
 *    Nếu file JSON sai chính tả hoặc sai kiểu, quá trình chạy test dừng ngay tại biên,
 *    báo rõ đường dẫn field bị lỗi thay vì để test crash ngầm lúc chạy.
 * 2. Multi-Environment Switching: Tự động đổi template Base ➔ Dev theo `NODE_ENV`.
 * 3. Type-Safe Autocomplete: getTestData('nekoOrders', 'deliveredOrder') tự gợi ý
 *    chính xác cả namespace lẫn key ở compile-time.
 * 4. Deep Clone & Immutability: Dữ liệu trả về được clone sâu qua structuredClone,
 *    không bị biến đổi (mutate) giữa các bài test chạy song song.
 */

// ── 1. Import Raw JSON Files ──────────────────────────────────────────────────
import customerDatasetsJson from "./crm/customer/datasets.json";
import customerTemplatesBaseJson from "./crm/customer/templates.base.json";
import customerTemplatesDevJson from "./crm/customer/templates.dev.json";
import loginCasesJson from "./crm/login/cases.json";

import cmsProductsJson from "./cms/json/products.json";
import cmsProductsDevJson from "./cms/json/products-dev.json";
import cmsLoginJson from "./cms/json/login.json";

import nekoOrdersJson from "./neko/json/orders.json";
import nekoProductsJson from "./neko/json/products.json";
import nekoApiProductsJson from "./neko/json/api-products.json";

// ── 2. Import Zod Validators ──────────────────────────────────────────────────
import {
  defineCustomerDatasets,
  defineCustomerTemplates,
} from "./crm/customer/customer.types";
import { defineLoginCases } from "./crm/login/login.types";
import {
  defineNekoOrders,
  defineNekoProducts,
  defineNekoApiProducts,
} from "./neko/neko-data.types";
import type { TestDataEntry } from "./common/test-data.types";

// ── 3. Re-export Factories & Types ───────────────────────────────────────────
export {
  createFullCustomerInfo,
  createMinimalCustomerInfo,
  generateCompanyName,
} from "./crm/customer/customer.factory";
export { loadLoginCredentialsFromEnv } from "./crm/login/login.factory";
export * as ProductDataFactory from "./cms/ProductDataFactory";
export {
  generateProductName,
  createMinimalProductInfo,
  createFullProductInfo,
} from "./cms/ProductDataFactory";
export type { ProductInfo } from "./cms/types";
export type { CustomerInfo } from "./crm/customer/customer.types";
export type {
  LoginCredentials,
  LoginCaseData,
  LoginErrorCaseData,
  LoginSuccessCaseData,
} from "./crm/login/login.types";
export type {
  NekoOrderItem,
  NekoProductItem,
  NekoApiProductPayload,
} from "./neko/neko-data.types";
export type { TestDataEntry } from "./common/test-data.types";

// ── 4. Runtime Zod Parsing ────────────────────────────────────────────────────
const loginCases = defineLoginCases(loginCasesJson);
const customerTemplatesBase = defineCustomerTemplates(customerTemplatesBaseJson);
const customerTemplatesDev = defineCustomerTemplates(customerTemplatesDevJson);
const customerDatasets = defineCustomerDatasets(customerDatasetsJson);

const nekoOrders = defineNekoOrders(nekoOrdersJson);
const nekoProducts = defineNekoProducts(nekoProductsJson);
const nekoApiProducts = defineNekoApiProducts(nekoApiProductsJson);

// ── 5. Environment Resolver ───────────────────────────────────────────────────
function getEnvironment(): string {
  const environment = process.env.TEST_ENV ?? process.env.NODE_ENV ?? "dev";
  return environment.toLowerCase();
}

function loadDataByEnvironment<T>(base: T, variants: Record<string, T>): T {
  const environment = getEnvironment();
  const normalizedEnvironment =
    environment === "development" ? "dev" : environment;
  return variants[normalizedEnvironment] ?? base;
}

// ── 6. Central Test Data Catalog ──────────────────────────────────────────────
export const testDataCatalog = {
  // CRM / Customer Domains
  loginCases,
  customerTemplates: loadDataByEnvironment(customerTemplatesBase, {
    dev: customerTemplatesDev,
  }),
  customerDatasets,

  // CMS Ecommerce Domains
  cmsProducts: loadDataByEnvironment(cmsProductsJson, {
    dev: cmsProductsDevJson,
  }),
  cmsLogin: cmsLoginJson,

  // Neko Coffee Domains (UI, API & Hybrid E2E)
  nekoOrders,
  nekoProducts,
  nekoApiProducts,
} as const;

export type TestDataCatalog = typeof testDataCatalog;
export type TestDataNamespace = keyof TestDataCatalog;

type TestDataKey<N extends TestDataNamespace> = keyof TestDataCatalog[N];

type EntryValue<T> = T extends TestDataEntry<infer D>
  ? D
  : T extends { data: infer D }
    ? D
    : T;

type TestDataValue<
  N extends TestDataNamespace,
  K extends TestDataKey<N>,
> = EntryValue<TestDataCatalog[N][K]>;

type TestDataOverrides<T> = T extends readonly unknown[]
  ? never
  : T extends object
    ? Partial<T>
    : never;

type TestDataOptions<T> = {
  overrides?: TestDataOverrides<T>;
};

type TestDataTransformOptions<T, R> = TestDataOptions<T> & {
  transform: (data: T) => R;
};

export type TestDataCase<N extends TestDataNamespace> = {
  [K in TestDataKey<N>]: {
    key: K;
    description: string;
    data: TestDataValue<N, K>;
  };
}[TestDataKey<N>];

// ── 7. Deep Clone Helper ──────────────────────────────────────────────────────
function cloneData<T>(data: T): T {
  if (typeof structuredClone !== "undefined") {
    return structuredClone(data);
  }
  return JSON.parse(JSON.stringify(data)) as T;
}

// ── 8. Public API: getTestCases() cho Data-Driven Tests ───────────────────────
export function getTestCases<N extends TestDataNamespace>(
  namespace: N
): TestDataCase<N>[] {
  const namespaceData = testDataCatalog[namespace] as unknown as Record<
    string,
    TestDataEntry
  >;

  return Object.entries(namespaceData).map(([key, entry]) => ({
    key,
    description: entry.description ?? key,
    data: cloneData(entry.data ?? entry),
  })) as TestDataCase<N>[];
}

// ── 9. Public API: getTestData() với Overloads ────────────────────────────────
export function getTestData<
  N extends TestDataNamespace,
  K extends TestDataKey<N>,
  R,
>(
  namespace: N,
  key: K,
  options: TestDataTransformOptions<TestDataValue<N, K>, R>
): R;

export function getTestData<
  N extends TestDataNamespace,
  K extends TestDataKey<N>,
>(
  namespace: N,
  key: K,
  options?: TestDataOptions<TestDataValue<N, K>>
): TestDataValue<N, K>;

export function getTestData<
  N extends TestDataNamespace,
  K extends TestDataKey<N>,
  R,
>(
  namespace: N,
  key: K,
  options?:
    | TestDataOptions<TestDataValue<N, K>>
    | TestDataTransformOptions<TestDataValue<N, K>, R>
): TestDataValue<N, K> | R {
  const namespaceData = testDataCatalog[namespace] as unknown as Record<
    string,
    TestDataEntry
  >;

  const rawEntry = namespaceData[key as string];
  if (!rawEntry) {
    throw new Error(
      `[TestData] Không tìm thấy key "${String(key)}" trong namespace "${String(
        namespace
      )}".`
    );
  }

  const cloned = cloneData(rawEntry.data !== undefined ? rawEntry.data : rawEntry);

  if (options && "overrides" in options && options.overrides) {
    if (typeof cloned === "object" && cloned !== null && !Array.isArray(cloned)) {
      Object.assign(cloned, options.overrides);
    }
  }

  if (options && "transform" in options && typeof options.transform === "function") {
    return options.transform(cloned as TestDataValue<N, K>);
  }

  return cloned as TestDataValue<N, K>;
}
