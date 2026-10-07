# AIVES Frontend

Frontend cho **AIVES (AI-powered Viva Exam System)**, xây dựng bằng React, Vite và Tailwind CSS.

## Chức năng chính

- Đăng nhập, đăng xuất và đăng ký tài khoản demo.
- Giao diện riêng cho Admin, Giảng viên và Sinh viên.
- Quản lý người dùng, môn học, kỳ thi, ngân hàng câu hỏi và ca thi.
- Duyệt câu hỏi và chấm điểm human-in-the-loop.
- Kiểm tra thiết bị trước thi, phòng thi AI và báo cáo kết quả mẫu.
- Hỗ trợ tiếng Việt và tiếng Anh.

## Cài đặt và chạy

```bash
npm install
npm run dev
```

Các lệnh khác:

```bash
npm run lint
npm run build
npm run preview
```

## Cấu hình

Tạo file `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

API backend mặc định là Spring Boot chạy tại `http://localhost:8080`.

## Lưu ý

- Hiện **chưa có database và API xác thực tài khoản**. Login, register, logout và Google login đang là flow demo lưu session bằng `localStorage`.
- Chưa tích hợp OAuth Google thật.
- Các chức năng AI, STT, TTS, ghi âm/giám sát và báo cáo nâng cao hiện là giao diện/prototype, cần backend tương ứng.
- Không commit file `.env` chứa thông tin nhạy cảm lên GitHub. Sử dụng `.env.example` để chia sẻ cấu hình mẫu.
