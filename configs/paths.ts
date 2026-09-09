import fs from 'fs';
import path from 'path';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 🧭 CENTRAL PATH REGISTRY — QUẢN LÝ ĐƯỜNG DẪN TẬP TRUNG (CLEAN ARCHITECTURE)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * 🎯 Mục tiêu:
 * 1. Triệt tiêu boilerplate `path.resolve(__dirname, '../...')` rải rác khắp các configs.
 * 2. Cung cấp API định hướng ngữ nghĩa (Semantic Paths) có TypeScript Autocomplete.
 * 3. Điểm neo duy nhất: Khi thay đổi cấu trúc thư mục, chỉ cần cập nhật tại đây.
 */

export const ROOT_DIR = path.resolve(__dirname, '..');

export const Paths = {
  /** Thư mục gốc dự án */
  root: (...segments: string[]) => path.resolve(ROOT_DIR, ...segments),

  /** Thư mục chứa kịch bản kiểm thử: src/presentation/tests */
  tests: (...segments: string[]) => path.resolve(ROOT_DIR, 'src/presentation/tests', ...segments),

  /** Thư mục chứa fixtures & setups: src/infrastructure/fixtures */
  fixtures: (...segments: string[]) => path.resolve(ROOT_DIR, 'src/infrastructure/fixtures', ...segments),

  /** Thư mục báo cáo kiểm thử: playwright-report (tự động đảm bảo thư mục tồn tại trên CI) */
  reports: (...segments: string[]) => {
    const reportDir = path.resolve(ROOT_DIR, 'playwright-report');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    return path.resolve(reportDir, ...segments);
  },

  /** Thư mục lưu trữ auth storage state: .auth (tự động đảm bảo thư mục tồn tại) */
  auth: (...segments: string[]) => {
    const authDir = path.resolve(ROOT_DIR, '.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    return path.resolve(authDir, ...segments);
  },

  /** Thư mục test data & assets: src/infrastructure/data */
  data: (...segments: string[]) => path.resolve(ROOT_DIR, 'src/infrastructure/data', ...segments),
};
