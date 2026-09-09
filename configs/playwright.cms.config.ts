import { devices } from '@playwright/test';
import {
  createPlaywrightConfig,
  CMS_UI_ORIGIN,
  AUTH_DIR,
} from './playwright.base.config';
import { Paths } from './paths';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 🏢 CMS PORTAL MICRO-PROJECT CONFIG (CLEAN ARCHITECTURE)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Chuyên trách toàn bộ kịch bản kiểm thử cổng quản trị CMS:
 * 1. cms-setup:   Đăng nhập quản trị viên và sinh file storage state
 * 2. cms-desktop: Kiểm thử giao diện máy tính để bàn (1080p, viewportType: 'desktop')
 * 3. cms-mobile:  Kiểm thử giao diện điện thoại (iPhone 12, kích hoạt gập cột Footable)
 */

export default createPlaywrightConfig({
  projects: [
    // ──────────────────────────────────────────────────────────
    // 🔐 1. SETUP: Đăng nhập CMS và lưu storage state ra đĩa
    // ──────────────────────────────────────────────────────────
    {
      name: 'cms-setup',
      testMatch: '**/auth.setup.ts',
      testDir: Paths.fixtures('cms'),
      use: {
        baseURL: CMS_UI_ORIGIN,
      },
    },

    // ──────────────────────────────────────────────────────────
    // 🖥️ 2. CMS DESKTOP: Kiểm thử chức năng trên Desktop Full HD
    // ──────────────────────────────────────────────────────────
    {
      name: 'cms-desktop',
      testDir: Paths.tests('cms'),
      testIgnore: '**/*.mobile.spec.ts',
      use: {
        baseURL: CMS_UI_ORIGIN,
        viewportType: 'desktop',
        storageState: `${AUTH_DIR}/cms-admin.json`,
      },
      dependencies: ['cms-setup'],
    },

    // ──────────────────────────────────────────────────────────
    // 📱 3. CMS MOBILE: Kích hoạt chế độ gập cột Footable Responsive
    // ──────────────────────────────────────────────────────────
    {
      name: 'cms-mobile',
      testDir: Paths.tests('cms'),
      testMatch: '**/*.mobile.spec.ts',
      use: {
        ...devices['iPhone 12'],
        baseURL: CMS_UI_ORIGIN,
        viewportType: 'mobile',
        storageState: `${AUTH_DIR}/cms-admin.json`,
      },
      dependencies: ['cms-setup'],
    },
  ],
});
