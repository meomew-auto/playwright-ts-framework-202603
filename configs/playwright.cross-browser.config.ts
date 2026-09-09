import { devices } from '@playwright/test';
import {
  createPlaywrightConfig,
  NEKO_UI_ORIGIN,
} from './playwright.base.config';
import { Paths } from './paths';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 🌐 CROSS-BROWSER & MULTI-DEVICE MATRIX CONFIG (CLEAN ARCHITECTURE)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Kiểm tra tính tương thích trên toàn bộ các Browser Engines và Thiết bị:
 * 1. chromium:       Google Chrome & Chromium Engine
 * 2. firefox:        Mozilla Firefox (Gecko Engine)
 * 3. webkit:         Apple Safari (WebKit Engine trên Windows)
 * 4. mobile-safari:  Apple iPhone 12 (iOS Safari viewport)
 * 5. mobile-chrome:  Google Pixel 7 (Android Chrome viewport)
 * 6. edge:           Microsoft Edge (Desktop Edge)
 */

export default createPlaywrightConfig({
  testDir: Paths.tests(),

  projects: [
    // ──────────────────────────────────────────────────────────
    // 🔴 1. CHROMIUM (Google Chrome Engine)
    // ──────────────────────────────────────────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: NEKO_UI_ORIGIN,
        viewportType: 'desktop',
      },
    },

    // ──────────────────────────────────────────────────────────
    // 🟠 2. FIREFOX (Gecko Engine)
    // ──────────────────────────────────────────────────────────
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: NEKO_UI_ORIGIN,
        viewportType: 'desktop',
      },
    },

    // ──────────────────────────────────────────────────────────
    // 🔵 3. WEBKIT (Apple Safari Engine)
    // ──────────────────────────────────────────────────────────
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        baseURL: NEKO_UI_ORIGIN,
        viewportType: 'desktop',
      },
    },

    // ──────────────────────────────────────────────────────────
    // 🍏 4. MOBILE SAFARI (iPhone 12 Emulation)
    // ──────────────────────────────────────────────────────────
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        baseURL: NEKO_UI_ORIGIN,
        viewportType: 'mobile',
      },
    },

    // ──────────────────────────────────────────────────────────
    // 🤖 5. MOBILE CHROME (Pixel 7 Emulation)
    // ──────────────────────────────────────────────────────────
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        baseURL: NEKO_UI_ORIGIN,
        viewportType: 'mobile',
      },
    },

    // ──────────────────────────────────────────────────────────
    // 🔷 6. MICROSOFT EDGE (Desktop Edge)
    // ──────────────────────────────────────────────────────────
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        baseURL: NEKO_UI_ORIGIN,
        viewportType: 'desktop',
      },
    },
  ],
});
