# S-D392-GROUP2 - AI-powered Viva Exam System (AIVES)

Hệ thống Phỏng vấn / Thi Vấn đáp Trí tuệ Nhân tạo thông minh.

---

## 📌 1. Danh sách Tài khoản Mẫu (Demo Accounts)

Mật khẩu mặc định cho tất cả tài khoản: `Password@123`

| Vai trò (Role) | Mã định danh / MSSV | Email đăng nhập | Họ và tên |
| :--- | :--- | :--- | :--- |
| **Thí sinh (STUDENT)** | `SE180123` | `phuctran5635@gmail.com` | Trần Hoàng Phúc |
| **Giảng viên (INSTRUCTOR)** | `GV001` | `gv.nguyen@fpt.edu.vn` | ThS. Nguyễn Văn Giảng |
| **Quản trị viên (ADMIN)** | `ADMIN01` | `admin@aives.edu.vn` | Quản trị viên Hệ thống |

> **Mẹo:** Trên màn hình Đăng nhập ([LoginPage](http://localhost:5173)), có thể chuyển đổi tab vai trò tương ứng để hệ thống tự điền thông tin, hoặc bấm các nút **Đăng nhập nhanh (Quick Fill)** ở cuối form.

---

## 💻 2. Công nghệ Sử dụng

* **Backend:** Java 17, Spring Boot 3.3.x, Spring Data JPA, Hibernate, PostgreSQL, Swagger UI (OpenAPI 3).
* **Frontend:** React 18, Vite, Modern Responsive CSS, Google Material Symbols, FontAwesome.

---

## 🚀 3. Hướng dẫn Khởi chạy Hệ thống

### A. Khởi chạy Backend (Spring Boot + PostgreSQL)

1. **Yêu cầu môi trường:**
   - **Java:** JDK 17 (hoặc JDK 21)
   - **Database:** PostgreSQL 15+ (mặc định: `localhost:5432`)
   - **Maven:** 3.8+

2. **Tạo Cơ sở dữ liệu:**
   Mở pgAdmin hoặc terminal PostgreSQL:
   ```sql
   CREATE DATABASE aives_db;
   ```

3. **Cấu hình kết nối:**
   Chỉnh sửa file `backend/src/main/resources/application.properties` khớp mật khẩu của bạn:
   ```properties
   spring.datasource.username=postgres
   spring.datasource.password=<mat_khau_postgres_cua_ban>
   ```

4. **Chạy Backend:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   *Swagger API Documentation:* 👉 **[http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)**

---

### B. Khởi chạy Frontend (React + Vite)

1. **Yêu cầu môi trường:**
   - **Node.js:** v18+ hoặc v20+
   - **npm:** 9+

2. **Cài đặt thư viện & Khởi chạy:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Truy cập ứng dụng tại:* 👉 **[http://localhost:5173](http://localhost:5173)**

---

## ✨ 4. Các Phân hệ & Tính năng Chính

1. **Xác thực & Phân quyền (Authentication & Authorization):**
   - Đăng nhập, Đăng ký lưu dữ liệu trực tiếp vào PostgreSQL backend kết hợp bộ nhớ cache đồng bộ.
   - Admin có quyền trực tiếp **gán và thay đổi vai trò (Role: ADMIN, INSTRUCTOR, STUDENT)** cho từng tài khoản trên giao diện bảng danh sách hoặc modal phân quyền chuyên dụng.
   - Tự động ghi nhận lịch sử thay đổi quyền vào tab Audit Logs.

2. **Cổng Thí sinh (Student Portal):**
   - Tra cứu danh sách ca thi sắp diễn ra, mã môn, thời lượng và khung giờ thi.
   - Trình hướng dẫn kiểm tra thiết bị 4 bước (*Pre-exam Device Check Wizard*): Camera 1080p, Microphone, Loa & Đường truyền.
   - Phòng thi vấn đáp AI trực tiếp (*AI Viva Examination Room*): Giao diện Split-screen truyền video webcam thực tế, đồng hồ đếm ngược, câu hỏi thích ứng (Adaptive follow-up) và nộp bài tự động.
   - Tra cứu lịch sử thi, xem phản hồi từ AI và Giảng viên, gửi đơn phúc khảo.

3. **Cổng Giảng viên (Lecturer Portal):**
   - Không gian chấm điểm Human-in-the-loop (Split-View Workspace): Giảng viên nghe lại audio câu trả lời của thí sinh, xem đề xuất điểm từ AI và chốt điểm số theo tiêu chí Rubric.
   - Ngân hàng câu hỏi & Tiêu chí Rubric theo thang đo tư duy Bloom (Nhớ, Hiểu, Vận dụng, Phân tích, Đánh giá, Sáng tạo).
   - Quản lý kỳ thi & Lập lịch ca thi.

4. **Cổng Quản trị viên (Admin Portal):**
   - Quản lý toàn diện tài khoản người dùng: Khóa/Mở khóa, Thêm người dùng, Phân quyền vai trò.
   - Cấu hình tham số AI Engine (LLM Core, Whisper STT, TTS Voice, Ngưỡng trễ phản xạ).
   - Nhật ký kiểm toán & Giám sát minh bạch phòng thi (Audit Logs).


## Updated Admin / Question Bank workflows

See [implementation and setup](docs/IMPLEMENTATION.md), [API contract](docs/API-WORKFLOWS.md), and [CSV import template](docs/question-import-template.csv). Demo accounts now require `AIVES_DEMO_ENABLED=true`; production uses environment-configured bootstrap Admin.
