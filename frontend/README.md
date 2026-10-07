# AIVES Frontend

Frontend React/Vite cho **AIVES - AI-powered Viva Exam System**.

## Chức năng

- Đăng nhập, đăng ký, logout và phân quyền `ADMIN`, `LECTURER`, `STUDENT`.
- Forgot-password/reset-password qua backend.
- Quản lý môn học, kỳ thi, câu hỏi, rubric và ca thi.
- Luồng sinh viên: lịch thi, kiểm tra thiết bị, phòng thi, transcript và báo cáo.
- Hỗ trợ camera, microphone, TTS, STT và ghi âm khi trình duyệt cho phép.
- Giao diện tiếng Việt/tiếng Anh.

## Yêu cầu

- Node.js LTS và npm.
- Backend AIVES đang chạy.
- Trình duyệt Chromium mới nếu cần camera, microphone, TTS hoặc STT.

PostgreSQL thuộc backend, không cần cài trong frontend.

## Cài đặt

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Mở `http://localhost:5173`.

Các lệnh kiểm tra:

```bash
npm run lint
npm run build
npm run preview
```

## Cấu hình

File `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Không thêm `/api` vào cuối URL. Sau khi sửa `.env`, cần restart Vite.

## API chính

Frontend gọi backend qua các nhóm endpoint:

```text
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password

/api/courses
/api/questions
/api/rubrics
/api/exams
/api/sessions
/api/users
```

Forgot-password gửi email. Reset-password nhận:

```json
{
  "token": "reset-token",
  "newPassword": "new-password",
  "confirmPassword": "new-password"
}
```

Backend phải triển khai endpoint reset và SMTP/email provider; frontend không tự gửi email.

## Lưu ý

- Frontend không chứa tài khoản mẫu. Database phải có user hợp lệ mới đăng nhập được.
- Backend mới là nơi quyết định quyền truy cập và điểm cuối.
- JWT hiện được lưu trong `localStorage` với key `aives-token` và `aives-session`.
- Nếu gặp `401/403`, đăng nhập lại hoặc xóa hai key trên rồi thử lại.
- Camera/microphone chỉ hoạt động trên `localhost` hoặc HTTPS và cần cấp quyền.
- Speech Recognition không được mọi trình duyệt hỗ trợ; có thể nhập transcript thủ công.
- Transcript/audio và AI follow-up hiện chưa được lưu/chấm thật nếu backend chưa có API tương ứng.
- Không commit `.env`, JWT, mật khẩu hoặc thông tin SMTP.

## Cấu trúc chính

```text
src/api/          API client
src/contexts/     Auth, data và language context
src/pages/        Login, dashboard, admin, lecturer, student
src/components/   Layout và component dùng chung
src/locales/      Bản dịch VI/EN
src/css/          CSS
```
