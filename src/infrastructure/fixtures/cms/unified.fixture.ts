/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CMS UNIFIED FIXTURE — Gộp tất cả fixtures của project CMS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * "Unified" nghĩa là gộp UI + API fixtures của 1 PROJECT.
 * Hiện tại CMS chỉ có UI (chưa có API fixtures), nên file này
 * đơn giản re-export từ gatekeeper.
 *
 * 📌 KHI THÊM CMS API:
 * ```typescript
 * import { test as uiTest } from './gatekeeper.fixture';
 * // export const test = mergeTests(uiTest, cmsApiTest);
 * ```
 *
 * 🔗 LIÊN KẾT:
 * - Re-export: gatekeeper.fixture.ts
 * - Dùng bởi: fixtures/unified.fixture.ts (global merge)
 * - Neko tương đương: neko/unified.fixture.ts (đã có UI + API)
 */

// CMS hiện tại chỉ có UI, chưa có API
// → unified = UI gatekeeper
import { test, GatekeeperFixtures } from './gatekeeper.fixture';

export { test as cmsUiTest };
export { expect } from '@playwright/test';

// Type cho global unified merge
export type CMSUnifiedFixtures = GatekeeperFixtures;
