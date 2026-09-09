import {
  createPlaywrightConfig,
  NEKO_UI_ORIGIN,
  NEKO_API_URL,
  AUTH_DIR,
} from './playwright.base.config';
import { Paths } from './paths';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * ☕ NEKO COFFEE MICRO-PROJECT CONFIG (CLEAN ARCHITECTURE)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Chuyên trách toàn bộ các bộ kiểm thử của Neko Coffee:
 * 1. neko-network: 37 bài test Network Interception (CDP Level, Mocking, HAR)
 * 2. neko-hybrid:  14 bài test Sandwich Model & Worker RAM Snapshot (0ms)
 * 3. neko-api:     Các bài test API CRUD độc lập & Zod Schema contract
 * 4. neko-ui:      Các bài test UI POM, TableColumnHelpers và Realtime Chat
 */

export default createPlaywrightConfig({
  projects: [
    // ──────────────────────────────────────────────────────────
    // 🐱 1. SETUP: Đăng nhập sinh token lưu trữ (cho tests cần file đĩa)
    // ──────────────────────────────────────────────────────────
    {
      name: 'neko-setup',
      testMatch: '**/neko.setup.ts',
      testDir: Paths.fixtures('neko'),
    },

    // ──────────────────────────────────────────────────────────
    // 🌐 2. NETWORK INTERCEPTION: CDP Level, Mocking, Tampering, HAR
    // ──────────────────────────────────────────────────────────
    {
      name: 'neko-network',
      testDir: Paths.tests('neko/01-network-interception'),
      use: {
        baseURL: NEKO_UI_ORIGIN,
      },
    },

    // ──────────────────────────────────────────────────────────
    // 🥪 3. HYBRID E2E: Sandwich Model 3 lớp & Worker RAM Snapshot 0ms
    // ──────────────────────────────────────────────────────────
    {
      name: 'neko-hybrid',
      testDir: Paths.tests('neko/02-hybrid-e2e'),
      use: {
        baseURL: NEKO_UI_ORIGIN,
      },
    },

    // ──────────────────────────────────────────────────────────
    // 🐱 4. API TESTS: CRUD & Zod Runtime Schema Validation
    // ──────────────────────────────────────────────────────────
    {
      name: 'neko-api',
      testDir: Paths.tests('neko/03-api'),
      use: {
        baseURL: NEKO_API_URL,
      },
      dependencies: ['neko-setup'],
    },

    // ──────────────────────────────────────────────────────────
    // 🖥️ 5. UI TESTS: TableColumnHelpers & Realtime Multi-Role Chat
    // ──────────────────────────────────────────────────────────
    {
      name: 'neko-ui',
      testDir: Paths.tests('neko/04-ui'),
      use: {
        baseURL: NEKO_UI_ORIGIN,
        storageState: `${AUTH_DIR}/neko-admin.json`,
      },
      dependencies: ['neko-setup'],
    },
  ],
});
