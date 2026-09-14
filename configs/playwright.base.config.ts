import { defineConfig, type PlaywrightTestConfig } from '@playwright/test';
import dotenvFlow from 'dotenv-flow';
import type { ViewportType } from '../src/infrastructure/fixtures/common/ViewportType';
import { EnvManager } from '../src/infrastructure/utils/EnvManager';
import { Paths, ROOT_DIR } from './paths';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 🧱 BASE PLAYWRIGHT CONFIG — CẤU HÌNH NỀN TẢNG KẾ THỪA (CLEAN ARCHITECTURE)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 NGUYÊN LÝ THIẾT KẾ:
 * 1. Don't Repeat Yourself (DRY): Toàn bộ logic khởi tạo biến môi trường, timeout,
 *    reporters, trace, launch options được gom tập trung tại đây.
 * 2. Inversion of Control: Các child config (Neko, CMS, Cross-Browser, API) chỉ
 *    cần kế thừa và bổ sung các project đặc thù.
 * 3. 100% Type-Safe: Hỗ trợ CustomTestOptions mở rộng với `viewportType`.
 */

// 1️⃣ Nạp biến môi trường đa tầng sớm nhất qua dotenv-flow
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

dotenvFlow.config({
  path: ROOT_DIR,
  default_node_env: 'development',
});

// 2️⃣ Định nghĩa Custom Test Options mở rộng
export type CustomTestOptions = {
  viewportType?: ViewportType;
};

// 3️⃣ Đọc biến môi trường từ EnvManager
export const CMS_UI_ORIGIN = EnvManager.get('CMS_UI_ORIGIN', 'https://coffee.autoneko.com');
export const NEKO_UI_ORIGIN = EnvManager.get('NEKO_UI_ORIGIN', 'https://coffee.autoneko.com');
export const NEKO_API_URL = EnvManager.get('NEKO_API_URL', 'https://api-neko-coffee.autoneko.com');
export const AUTH_DIR = Paths.root(EnvManager.get('AUTH_DIR', '.auth'));
export const DEFAULT_TIMEOUT = EnvManager.getNumber('DEFAULT_EXPECT_TIMEOUT', 30000);

// 4️⃣ Đối tượng cấu hình nền tảng dùng chung
export const baseConfig: PlaywrightTestConfig<CustomTestOptions> = {
  testDir: Paths.tests(),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : (process.env.WORKERS ? Number(process.env.WORKERS) : 4),
  timeout: DEFAULT_TIMEOUT,

  reporter: [
    ['line'],
    [
      'playwright-smart-reporter',
      {
        outputFile: Paths.reports('smart-report.html'),
        historyFile: Paths.reports('test-history.json'),
        maxHistoryRuns: 20,
        enableAIRecommendations: false,
        enableAISuiteHealth: false,
      },
    ],
    [
      'html',
      {
        outputFolder: Paths.reports('html'),
        open: 'never',
      },
    ],
  ],

  use: {
    baseURL: NEKO_UI_ORIGIN,
    trace: 'on-first-retry',
    headless: !!process.env.CI,
    actionTimeout: 15000,
    launchOptions: {
      args: ['--start-maximized'],
    },
    viewport: null,
    locale: 'vi-VN',
  },
};

/**
 * Hàm trợ giúp tạo cấu hình con có kế thừa chuẩn mực (Factory Pattern)
 */
export function createPlaywrightConfig<T = CustomTestOptions, W = {}>(
  overrides: PlaywrightTestConfig<T, W>
): PlaywrightTestConfig<CustomTestOptions & T, W> {
  const { use: baseUse, ...baseRest } = baseConfig;
  const { use: overrideUse, ...overrideRest } = overrides;

  return defineConfig({
    ...baseRest,
    ...overrideRest,
    use: {
      ...baseUse,
      ...overrideUse,
    },
  }) as unknown as PlaywrightTestConfig<CustomTestOptions & T, W>;
}
