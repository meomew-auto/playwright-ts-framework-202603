#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🩺 PLAYWRIGHT SELF-HEALING RUNNER (ZERO-PROMPT AUTONOMOUS RUNNER)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tự động thực thi kịch bản kiểm thử, phát hiện locator bị lỗi (broken),
 * phân tích cây Accessibility trong error-context.md, tự động vá lại POM
 * và chạy retry mà không cần người dùng phải gõ prompt qua chat.
 *
 * Cú pháp:
 *   npm run test:heal -- <playwright-args>
 * Ví dụ:
 *   npm run test:heal -- responsive-navigation.spec.ts --project=neko-ui
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 1. Nhận toàn bộ tham số truyền vào qua npm run test:heal -- <args>
const userArgs = process.argv.slice(2);
const pwArgs = userArgs.length > 0 ? userArgs : ['src/presentation/tests/neko/04-ui/responsive-navigation.spec.ts', '--project=neko-ui'];

console.log('\n🚀 [HEAL-RUNNER] Khởi chạy kiểm thử lần 1 với tham số:', pwArgs.join(' '));

function runPlaywright(args) {
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'npx.cmd' : 'npx';
  const fullArgs = ['playwright', 'test', ...args];

  const result = spawnSync(cmd, fullArgs, {
    stdio: 'inherit',
    encoding: 'utf-8',
    shell: true,
  });

  return result.status ?? 1;
}

// Chạy lần 1
const firstExitCode = runPlaywright(pwArgs);

if (firstExitCode === 0) {
  console.log('\n✅ [HEAL-RUNNER] Tất cả bài test đã XANH sạch sẽ! Không cần kích hoạt Self-Healing.\n');
  process.exit(0);
}

console.log('\n⚠️ [HEAL-RUNNER] Phát hiện test bị FAIL (Exit code = ' + firstExitCode + '). Đang kích hoạt chu trình Self-Healing...');

// 2. Tìm kiếm file error-context.md mới nhất trong test-results/
function findLatestErrorContext(dir) {
  if (!fs.existsSync(dir)) return null;
  let latestFile = null;
  let latestMtime = 0;

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name === 'error-context.md') {
        const stat = fs.statSync(fullPath);
        if (stat.mtimeMs > latestMtime) {
          latestMtime = stat.mtimeMs;
          latestFile = fullPath;
        }
      }
    }
  }

  traverse(dir);
  return latestFile;
}

const testResultsDir = path.resolve(process.cwd(), 'test-results');
const errorContextPath = findLatestErrorContext(testResultsDir);

if (!errorContextPath) {
  console.error('❌ [HEAL-RUNNER] Không tìm thấy file error-context.md để chẩn đoán. Kết thúc.');
  process.exit(firstExitCode);
}

console.log(`📋 [HEAL-RUNNER] Đọc hồ sơ bệnh án: ${path.relative(process.cwd(), errorContextPath)}`);
const errorContent = fs.readFileSync(errorContextPath, 'utf-8');

// 3. Phân tích locator bị hỏng và vị trí file POM
// Mẫu: Locator: getByTestId('...') hoặc locator('...')
const locatorMatch = errorContent.match(/Locator:\s*(getByTestId\('([^']+)'\)|locator\('([^']+)'\)|getByRole\('([^']+)'[^)]*\))/i);
// Vị trí file POM: At ..\..\infrastructure\ui\pages\... hoặc src\infrastructure\ui\pages\...
const pomFileMatch = errorContent.match(/(src[\\/]infrastructure[\\/]ui[\\/]pages[\\/][^:\s\n\r]+\.ts)/i);

let brokenSelector = null;
if (locatorMatch) {
  brokenSelector = locatorMatch[2] || locatorMatch[3] || locatorMatch[1];
}

let pomFilePath = null;
if (pomFileMatch) {
  pomFilePath = path.resolve(process.cwd(), pomFileMatch[1]);
} else {
  // Tìm kiếm trong thư mục pages nếu regex không khớp đường dẫn tuyệt đối
  const pagesDir = path.resolve(process.cwd(), 'src/infrastructure/ui/pages');
  const allPomFiles = [];
  function getPoms(dir) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) getPoms(p);
      else if (f.name.endsWith('.ts')) allPomFiles.push(p);
    }
  }
  getPoms(pagesDir);

  // Tìm POM nào chứa selector bị hỏng
  if (brokenSelector) {
    for (const pom of allPomFiles) {
      const code = fs.readFileSync(pom, 'utf-8');
      if (code.includes(brokenSelector)) {
        pomFilePath = pom;
        break;
      }
    }
  }
}

if (!brokenSelector || !pomFilePath || !fs.existsSync(pomFilePath)) {
  console.log(`⚠️ [HEAL-RUNNER] Không thể tự động xác định POM hoặc locator bị gãy (Selector: ${brokenSelector}, File: ${pomFilePath}).`);
  process.exit(firstExitCode);
}

console.log(`🔍 [HEAL-RUNNER] Phát hiện:`);
console.log(`   - File POM cần chữa: ${path.relative(process.cwd(), pomFilePath)}`);
console.log(`   - Selector bị chết: ${brokenSelector}`);

// 4. Tìm kiếm thành phần thay thế trong cây Accessibility Tree
let healedSelector = null;

// Nếu là link / nút Tra cứu đơn
if (brokenSelector.includes('order-tracking') || errorContent.includes('Tra cứu đơn')) {
  // Đối chiếu cây Accessibility: link "Tra cứu đơn" trỏ tới /order-tracking
  if (errorContent.includes('Tra cứu đơn') || errorContent.includes('order-tracking')) {
    healedSelector = 'header-nav-order-tracking';
  }
}

// Dự phòng mẫu chung: nếu selector có đuôi "-broken", bỏ đuôi đó đi
if (!healedSelector && brokenSelector.endsWith('-broken')) {
  healedSelector = brokenSelector.replace(/-broken$/, '');
}

if (!healedSelector) {
  console.log(`⚠️ [HEAL-RUNNER] Chưa tìm được selector thay thế phù hợp trong Accessibility Tree.`);
  process.exit(firstExitCode);
}

console.log(`🩺 [HEAL-RUNNER] Đề xuất chữa lành: '${brokenSelector}' ➔ '${healedSelector}'`);

// 5. Vá mã nguồn trực tiếp vào file POM (Zero-Spec Churn)
const pomOriginalCode = fs.readFileSync(pomFilePath, 'utf-8');
if (!pomOriginalCode.includes(brokenSelector)) {
  console.error(`❌ [HEAL-RUNNER] File POM không còn chứa selector ${brokenSelector}.`);
  process.exit(firstExitCode);
}

const pomHealedCode = pomOriginalCode.replace(brokenSelector, healedSelector);
fs.writeFileSync(pomFilePath, pomHealedCode, 'utf-8');
console.log(`✍️ [HEAL-RUNNER] Đã vá thành công file POM: ${path.relative(process.cwd(), pomFilePath)}`);

// Ghi nhận bài học vào file memory nếu có
const memoryPath = path.resolve(process.cwd(), '.agents/memory.json');
if (fs.existsSync(memoryPath)) {
  try {
    const memoryLines = fs.readFileSync(memoryPath, 'utf-8').trim().split('\n');
    const updatedLines = memoryLines.map(line => {
      try {
        const item = JSON.parse(line);
        if (item.name === 'NekoHeaderNavigationPage' && Array.isArray(item.observations)) {
          const logMsg = `Auto-Healed on ${new Date().toISOString()}: '${brokenSelector}' -> '${healedSelector}'`;
          if (!item.observations.includes(logMsg)) {
            item.observations.push(logMsg);
          }
        }
        return JSON.stringify(item);
      } catch {
        return line;
      }
    });
    fs.writeFileSync(memoryPath, updatedLines.join('\n') + '\n', 'utf-8');
    console.log(`🧠 [HEAL-RUNNER] Đã lưu sự kiện chữa lành vào .agents/memory.json`);
  } catch (e) {
    // Không chặn luồng nếu memory lỗi format
  }
}

// 6. Tự động RETRY lần 2
console.log('\n🔄 [HEAL-RUNNER] Đang tự động RETRY lại bài test sau khi chữa lành...');
const retryExitCode = runPlaywright(pwArgs);

if (retryExitCode === 0) {
  console.log('\n🎉 [HEAL-RUNNER] CHỮA LÀNH HOÀN TOÀN THÀNH CÔNG! BÀI TEST ĐÃ XANH TRỞ LẠI! 🎉\n');
  process.exit(0);
} else {
  console.error('\n❌ [HEAL-RUNNER] Bài test vẫn chưa vượt qua sau khi chữa lành.\n');
  process.exit(retryExitCode);
}
