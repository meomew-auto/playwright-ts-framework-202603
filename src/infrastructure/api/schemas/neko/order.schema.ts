import { z } from "zod";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 📦 NEKO ORDER ZOD SCHEMAS & RUNTIME CONTRACTS (SCHEMA-FIRST / SINGLE SOURCE)
 * ════════════════════════════════════════════════════════════════════════════
 * Khai báo Schema xác thực runtime và tự động suy diễn kiểu TypeScript (compile-time).
 * Tuân thủ chuẩn mực Bài 24: Không duy trì file *.interface.ts thủ công.
 */

// ─────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────

export const orderStatusEnum = z.enum([
  "pending",
  "confirmed",
  "processing",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
]);
export type OrderStatus = z.infer<typeof orderStatusEnum>;

export const paymentStatusEnum = z.enum(["unpaid", "paid", "refunded"]);
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

export const paymentMethodEnum = z.enum([
  "cash",
  "vnpay",
  "momo",
  "bank_transfer",
]);
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;

export const orderTypeEnum = z.enum(["b2c", "b2b"]);
export type OrderType = z.infer<typeof orderTypeEnum>;

// ─────────────────────────────────────────────────────────────────────────
// ORDER ENTITY SCHEMA
// ─────────────────────────────────────────────────────────────────────────

export const orderSchema = z.object({
  id: z.number(),
  order_number: z.string(),
  order_type: orderTypeEnum,
  customer_id: z.number(),
  status: orderStatusEnum,
  subtotal: z.number(),
  discount_percent: z.number().default(0),
  discount_amount: z.number().default(0),
  tax_amount: z.number().default(0),
  total_amount: z.number(),
  paid_amount: z.number().default(0),
  payment_status: paymentStatusEnum,
  payment_method: paymentMethodEnum,
  notes: z.string().nullable().optional(),
  approved_by: z.number().nullable().optional(),
  approved_at: z.string().nullable().optional(),
  shipped_at: z.string().nullable().optional(),
  delivered_at: z.string().nullable().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  shipping_name: z.string(),
  shipping_address: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Order = z.infer<typeof orderSchema>;

// ─────────────────────────────────────────────────────────────────────────
// PAGINATION & RESPONSES
// ─────────────────────────────────────────────────────────────────────────

export const orderPaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total_items: z.number().optional(),
  total_pages: z.number().optional(),
  has_next: z.boolean().optional(),
  has_prev: z.boolean().optional(),
});
export type OrderPagination = z.infer<typeof orderPaginationSchema>;

export const orderPaginationResponseSchema = z.object({
  data: z.array(orderSchema),
  pagination: orderPaginationSchema,
});
export type OrderPaginationResponse = z.infer<typeof orderPaginationResponseSchema>;

export const orderFilterParamsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  status: z.union([orderStatusEnum, z.string()]).optional(),
  order_type: orderTypeEnum.optional(),
  payment_status: paymentStatusEnum.optional(),
  search: z.string().optional(),
});
export type OrderFilterParams = z.infer<typeof orderFilterParamsSchema>;

// ─────────────────────────────────────────────────────────────────────────
// COMPACT EXPORT OBJECT FOR RUNTIME VALIDATION
// ─────────────────────────────────────────────────────────────────────────

export const OrderSchemas = {
  Order: orderSchema,
  Status: orderStatusEnum,
  Pagination: orderPaginationSchema,
  PaginationResponse: orderPaginationResponseSchema,
  FilterParams: orderFilterParamsSchema,
};
