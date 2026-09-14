/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌟 ROOT MASTER PLAYWRIGHT CONFIG — TỔNG ĐIỀU PHỐI (CLEAN ARCHITECTURE)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 📌 KIẾN TRÚC ĐA CẤU HÌNH (MODULAR MICRO-PROJECTS):
 * 1. Base Config:    ./configs/playwright.base.config.ts (DRY - tập trung toàn bộ cấu hình chung)
 * 2. Neko Project:   ./configs/playwright.neko.config.ts (Chạy độc lập Neko Coffee)
 * 3. CMS Project:    ./configs/playwright.cms.config.ts (Chạy độc lập CMS Portal)
 * 4. Cross-Browser:  ./configs/playwright.cross-browser.config.ts (Ma trận đa trình duyệt)
 * 5. API Fast-Track: ./configs/playwright.api.config.ts (Tối ưu hóa không browser cho API)
 *
 * File này đóng vai trò Root Master Orchestrator khi người dùng chạy `npx playwright test`
 * mà không chỉ định --config.
 */

import { devices } from '@playwright/test';
import {
  createPlaywrightConfig,
  CMS_UI_ORIGIN,
  NEKO_UI_ORIGIN,
  NEKO_API_URL,
  AUTH_DIR,
} from './configs/playwright.base.config';
import { Paths } from './configs/paths';

export default createPlaywrightConfig({
  testDir: Paths.tests(),

  projects: [
    // ──────────────────────────────────────────────────────────
    // 🔐 1. SETUPS: Đăng nhập và tạo storage state
    // ──────────────────────────────────────────────────────────
    {
      name: 'cms-setup',
      testMatch: '**/auth.setup.ts',
      testDir: Paths.fixtures('cms'),
      use: {
        baseURL: CMS_UI_ORIGIN,
      },
    },
    {
      name: 'neko-setup',
      testMatch: '**/neko.setup.ts',
      testDir: Paths.fixtures('neko'),
    },

    // ──────────────────────────────────────────────────────────
    // ☕ 2. NEKO COFFEE SUITES: Network, Hybrid, API, UI
    // ──────────────────────────────────────────────────────────
    {
      name: 'neko-network',
      testDir: Paths.tests('neko/01-network-interception'),
      use: {
        baseURL: NEKO_UI_ORIGIN,
      },
    },
    {
      name: 'neko-hybrid',
      testDir: Paths.tests('neko/02-hybrid-e2e'),
      use: {
        baseURL: NEKO_UI_ORIGIN,
      },
    },
    {
      name: 'neko-api',
      testDir: Paths.tests('neko/03-api'),
      use: {
        baseURL: NEKO_API_URL,
      },
      dependencies: ['neko-setup'],
    },
    {
      name: 'neko-ui',
      testDir: Paths.tests('neko/04-ui'),
      use: {
        baseURL: NEKO_UI_ORIGIN,
        storageState: `${AUTH_DIR}/neko-admin.json`,
      },
      dependencies: ['neko-setup'],
    },

    // ──────────────────────────────────────────────────────────
    // 🏢 3. CMS SUITES: Desktop & Mobile Footable
    // ──────────────────────────────────────────────────────────
    {
      name: 'cms-desktop',
      testDir: Paths.tests('cms'),
      testIgnore: '**/*.mobile.spec.ts',
      use: {
        baseURL: CMS_UI_ORIGIN,
        viewportType: 'desktop' as const,
        storageState: `${AUTH_DIR}/cms-admin.json`,
      },
      dependencies: ['cms-setup'],
    },
    {
      name: 'cms-mobile',
      testDir: Paths.tests('cms'),
      testMatch: '**/*.mobile.spec.ts',
      use: {
        ...devices['iPhone 12'],
        baseURL: CMS_UI_ORIGIN,
        viewportType: 'mobile' as const,
        storageState: `${AUTH_DIR}/cms-admin.json`,
      },
      dependencies: ['cms-setup'],
    },
  ],
});

