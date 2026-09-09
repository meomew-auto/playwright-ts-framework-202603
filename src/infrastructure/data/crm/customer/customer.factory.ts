import { faker } from "@faker-js/faker";
import type { CustomerInfo } from "./customer.types";

// ── Factory: dữ liệu ĐỘNG sinh tại runtime ──────────────────────────────────
export function generateCompanyName(prefix: string): string {
  const fakeCompany = faker.company.name();
  const timestamp = new Date().toTimeString().slice(0, 8);
  return `${prefix} ${fakeCompany} ${timestamp}`;
}

// Customer TỐI GIẢN: chỉ sinh company (field bắt buộc của form), các field
// khác để mặc định — dùng cho test chỉ cần hoàn thành form nhanh.
// overrides spread SAU cùng → key nào truyền vào luôn thắng company mặc định.
export function createMinimalCustomerInfo(
  overrides?: Partial<CustomerInfo>,
): CustomerInfo {
  return {
    company: generateCompanyName("Auto PW-032026"),
    ...overrides,
  };
}

// Customer ĐẦY ĐỦ: mọi field có giá trị faker hợp lệ — dùng cho test verify
// chi tiết từng field trên Profile (expectCustomerDetails).
// Pattern per-field: overrides?.x ?? default — field không override thì sinh
// default; dòng ...overrides cuối cùng là lưới an toàn đảm bảo mọi key
// override đều thắng kể cả khi field mới được thêm vào model sau này.
// country mặc định "Vietnam" vì "United States" trong dropdown có 2 option
// cùng tiền tố (Minor Outlying Islands) làm helper match substring bị
// strict violation — xem TC_TD_02.
export function createFullCustomerInfo(
  overrides?: Partial<CustomerInfo>,
): CustomerInfo {
  return {
    company: overrides?.company ?? generateCompanyName("Auto PW"),
    phone: overrides?.phone ?? faker.phone.number(),
    vat: overrides?.vat ?? faker.string.numeric(10),
    website: overrides?.website ?? faker.internet.url(),
    currency: overrides?.currency ?? faker.helpers.arrayElement(["USD", "EUR"]),
    language: overrides?.language ?? "Vietnamese",
    address: overrides?.address ?? faker.location.streetAddress(),
    city: overrides?.city ?? faker.location.city(),
    state: overrides?.state ?? faker.location.state(),
    zip: overrides?.zip ?? faker.location.zipCode(),
    country: overrides?.country ?? "Vietnam",
    ...overrides,
  };
}
