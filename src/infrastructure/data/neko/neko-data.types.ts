import { z } from "zod";
import type { TestDataEntry } from "../common/test-data.types";

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * ☕ NEKO COFFEE TEST DATA SCHEMAS (ZOD RUNTIME VALIDATION)
 * ══════════════════════════════════════════════════════════════════════════════
 */

// 1️⃣ Schema cho Đơn Hàng UI Neko Coffee
export const nekoOrderItemSchema = z.object({
  orderCode: z.string(),
  customerName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  totalAmount: z.string(),
  status: z.string(),
  createdAt: z.string().optional(),
}).strict();

export type NekoOrderItem = z.infer<typeof nekoOrderItemSchema>;

export const nekoOrdersCatalogSchema = z.record(
  z.string(),
  z.object({
    description: z.string(),
    data: nekoOrderItemSchema,
  })
);

export function defineNekoOrders(rawJson: unknown): Record<string, TestDataEntry<NekoOrderItem>> {
  return nekoOrdersCatalogSchema.parse(rawJson) as Record<string, TestDataEntry<NekoOrderItem>>;
}

// 2️⃣ Schema cho Sản Phẩm UI Neko Coffee
export const nekoProductItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  type: z.enum(["bean", "equipment", "accessory"]),
  price: z.number().nonnegative(),
  stockStatus: z.string(),
  origin: z.string().optional(),
  roastLevel: z.string().optional(),
  warrantyMonths: z.number().optional(),
}).strict();

export type NekoProductItem = z.infer<typeof nekoProductItemSchema>;

export const nekoProductsCatalogSchema = z.record(
  z.string(),
  z.object({
    description: z.string(),
    data: nekoProductItemSchema,
  })
);

export function defineNekoProducts(rawJson: unknown): Record<string, TestDataEntry<NekoProductItem>> {
  return nekoProductsCatalogSchema.parse(rawJson) as Record<string, TestDataEntry<NekoProductItem>>;
}

// 3️⃣ Schema cho Payload API Sản Phẩm Neko Coffee (Dùng cho API POST/PUT & Hybrid Seeding)
export const nekoApiProductPayloadSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm không được để trống"),
  type: z.enum(["bean", "equipment", "accessory"]),
  price_per_unit: z.number().positive("Đơn giá phải là số dương"),
  unit_type: z.enum(["kg", "piece", "box"]).optional(),
  origin: z.string().optional(),
  roast_level: z.enum(["Light", "Medium", "Dark"]).optional(),
  description: z.string().optional(),
}).strict();

export type NekoApiProductPayload = z.infer<typeof nekoApiProductPayloadSchema>;

export const nekoApiProductsCatalogSchema = z.record(
  z.string(),
  z.object({
    description: z.string(),
    data: nekoApiProductPayloadSchema,
  })
);

export function defineNekoApiProducts(rawJson: unknown): Record<string, TestDataEntry<NekoApiProductPayload>> {
  return nekoApiProductsCatalogSchema.parse(rawJson) as Record<string, TestDataEntry<NekoApiProductPayload>>;
}
