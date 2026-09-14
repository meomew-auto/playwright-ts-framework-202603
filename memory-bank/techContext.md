# 🛠️ Tech Context: Công Nghệ & Lệnh Thực Thi

## 📦 Stack Công Nghệ
- **Core**: Playwright Test (^1.61.1), Node.js (v24.x), TypeScript (^5.7.0).
- **Validation & Data**: Zod (^3.23.8), @faker-js/faker (^10.1.0).
- **Environment**: dotenv-flow (^4.1.0).
- **Reporting**: playwright-smart-reporter (^2.2.0), Playwright HTML Reporter.

## 🚀 Các Lệnh Thực Thi Thường Dùng
```bash
# Kiểm tra TypeScript toàn dự án (Bắt buộc 0 lỗi)
npm run typecheck

# Chạy test suite Neko UI
npx playwright test src/presentation/tests/neko/04-ui/ --project=neko-ui

# Chạy test suite CMS Desktop
npx playwright test src/presentation/tests/cms/ --project=cms-desktop

# Mở báo cáo kiểm thử
npm run report:smart
```
