/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 📦 UNIVERSAL TEST DATA TYPES (CLEAN ARCHITECTURE)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Khung type dùng chung cho toàn bộ các catalog dữ liệu kiểm thử (JSON).
 * Mỗi entry bắt buộc gồm:
 * - description: Mô tả mục đích kịch bản kiểm thử (tiếng Việt)
 * - data: Payload dữ liệu thật đã được validate qua Zod Schema
 */

export type TestDataEntry<T = unknown> = {
  description: string;
  data: T;
};

export type TestDataOverrides<T> = T extends readonly unknown[]
  ? never
  : T extends object
    ? Partial<T>
    : never;

export type TestDataOptions<T> = {
  overrides?: TestDataOverrides<T>;
};

export type TestDataTransformOptions<T, R> = TestDataOptions<T> & {
  transform: (data: T) => R;
};
