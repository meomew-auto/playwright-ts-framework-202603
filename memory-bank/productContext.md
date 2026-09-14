# 💡 Product Context: Bối Cảnh & Mục Tiêu Đào Tạo

## ❓ Vì Sao Dự Án Này Tồn Tại?
1. **Giải quyết vấn đề của các dự án lớn**: Trong các hệ thống Enterprise, kiểm thử UI thuần túy thường rất chậm (mất hàng giờ), dễ bị flaky và ô nhiễm dữ liệu. Dự án này cung cấp mô hình **Hybrid Dual-Engine** kết hợp API + UI chạy song song trên cùng 1 fixture.
2. **Giải quyết vấn đề đa domain (Multi-Domain)**: Không nhồi nhét tất cả page objects và fixtures vào một mớ hỗn độn. Mỗi domain (`cms`, `neko`, `crm`) có một vùng lãnh thổ độc lập, có thể chạy riêng lẻ hoặc chạy chung toàn bộ.
3. **Chuẩn mực cho AI Agent & Học Viên**: Đặt ra các nguyên tắc code sạch (Clean Code), type-safe 100%, không hardcode selector, không sleep cứng (`waitForTimeout`).

## 👥 Đối Tượng Sử Dụng
- **Học viên / Học sinh**: Học tư duy Automation chuyên nghiệp cấp Enterprise, hiểu sâu bản chất Playwright và TypeScript.
- **AI Coding Agents (Roo Code, Cline, Antigravity)**: Tự động tiếp nhận yêu cầu, thiết kế POM, viết test case và chẩn đoán lỗi theo quy chuẩn định sẵn mà không cần người hướng dẫn phải nhắc lại các luật cơ bản.
