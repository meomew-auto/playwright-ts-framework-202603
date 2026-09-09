import {
  createPlaywrightConfig,
  NEKO_API_URL,
} from './playwright.base.config';
import { Paths } from './paths';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * ⚡ HIGH-PERFORMANCE API & CONTRACT TEST CONFIG (CLEAN ARCHITECTURE)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Chuyên trách thực thi các bộ kiểm thử API thuần túy và Zod Schema Contract:
 * 1. Tối đa hóa hiệu năng: Chạy song song 100% core CPU (workers: '100%')
 * 2. Triệt tiêu độ trễ: Không khởi tạo Browser UI DOM, chỉ dùng HTTP Request Context
 * 3. Tự động liên kết Setup để sinh auth state khi chạy độc lập
 */

export default createPlaywrightConfig({
  testDir: Paths.tests(),
  testMatch: [
    '**/03-api/**/*.spec.ts',
    '**/*api*/**/*.spec.ts',
    '**/*.api.spec.ts',
  ],

  // Chạy song song tối đa
  workers: process.env.CI ? 2 : '100%',

  use: {
    baseURL: NEKO_API_URL,
    extraHTTPHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    trace: 'off',
  },

  projects: [
    {
      name: 'neko-setup',
      testMatch: '**/neko.setup.ts',
      testDir: Paths.fixtures('neko'),
    },
    {
      name: 'api-fast-track',
      dependencies: ['neko-setup'],
    },
  ],
});
