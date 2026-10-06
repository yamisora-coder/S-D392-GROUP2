# AI-powered Viva Exam System (AIVES)

> **Kho mã nguồn:** `yamisora-coder/S-D392-GROUP2`  
> **Kiến trúc:** Clean / Onion Architecture đồng bộ cho cả Backend & Frontend  
> **Ngăn xếp Backend:** Java 21 LTS, Spring Boot 3.3.4, Hibernate 6.5, PostgreSQL 18, Flyway Migration, Spring Security 6 (JWT)  
> **Ngăn xếp Frontend:** React 18, Vite, TypeScript, Lucide Icons, Axios  

---

## 🎯 Giới thiệu Dự án (Project Overview)

**AIVES (AI-powered Viva Exam System)** là nền tảng khảo thí thông minh được xây dựng nhằm hiện đại hóa và tự động hóa quy trình thi vấn đáp trực tuyến (viva voce examination). Hệ thống giải quyết các bài toán nan giải trong thi vấn đáp truyền thống:
- **Ngân hàng Câu hỏi & Rubric Chuẩn hóa:** Giảng viên biên soạn hoặc dùng AI (RAG) sinh câu hỏi từ giáo trình/slide môn học theo Thang đo nhận thức Bloom (`REMEMBER` đến `CREATE`) và gắn barem chấm điểm chi tiết.
- **Phòng thi Vấn đáp AI Trực tuyến (Viva Core Engine):** AI đóng vai trò giám khảo thông minh: tự động phát âm câu hỏi bằng giọng nói (TTS), lắng nghe thí sinh trả lời qua micro (STT), và linh hoạt đặt câu hỏi phụ đào sâu thích ứng (Adaptive follow-up probing).
- **Chấm điểm Chẩn đoán với Nguyên tắc Human-in-the-Loop:** AI đối chiếu câu trả lời với barem Rubric để đưa ra đề xuất điểm số, điểm mạnh, điểm yếu và các ý bỏ sót. **Giảng viên luôn là người duy nhất nắm quyền thẩm định và phê duyệt điểm số chính thức.**

---

## 📚 Hệ thống Tài liệu Dự án Chuẩn mực (`docs/`)

Toàn bộ tài liệu được chuẩn hóa theo nguyên tắc *Single Source of Truth* (Không trùng lặp, tập trung và dễ bảo trì):

- **Quy tắc Bất biến:** [Hướng dẫn & Quy ước AI Agent (`AGENTS.md`)](AGENTS.md)
- **Đặc tả Ca sử dụng & Luồng Nghiệp vụ:** [14 Use Cases & Sơ đồ Swimlane (`docs/use-cases.md`)](docs/use-cases.md)
- **Hợp đồng REST API (BE & FE):** [Đặc tả REST API Endpoints (`docs/api-contract.md`)](docs/api-contract.md)
- **Cơ sở Dữ liệu (PostgreSQL 18):** [Thiết kế CSDL & Từ điển Dữ liệu (`docs/database.md`)](docs/database.md) | [Flyway Migrations (`backend/src/main/resources/db/migration/`)](backend/src/main/resources/db/migration/)
- **Trí tuệ Nhân tạo (AI):** [Đặc tả RAG, Viva Voice & Chấm điểm (`docs/ai-specification.md`)](docs/ai-specification.md)

---

## 🏗️ Cấu trúc Thư mục Clean / Onion Architecture

```text
SWD/
├── backend/                                # BACKEND (Spring Boot 3.3.4, Java 21 LTS)
│   ├── src/main/java/com/group2/aives/
│   │   ├── domain/                         # Lõi Nghiệp vụ (18 JPA Entities, 6 Enums, Exceptions)
│   │   ├── application/                   # Use Cases (Port In/Out, Services, Request/Response DTOs)
│   │   ├── infrastructure/                # Hạ tầng (Config, Security JWT, External AI Adapters)
│   │   └── presentation/                  # REST Controllers, GlobalExceptionHandler, ApiResponse<T>
│   └── src/main/resources/
│       ├── db/migration/                  # Flyway Migrations (V1__initial_schema.sql, V2__seed_master_roles.sql)
│       └── application.properties         # Cấu hình Hibernate validate, Flyway, DataSource, JWT
│
├── frontend/                               # FRONTEND (React 18 / Vite / TypeScript)
│   ├── src/
│   │   ├── domain/                         # Thực thể dữ liệu & Từ điển song ngữ (types.ts, i18n.ts)
│   │   ├── infrastructure/api/             # Axios client, JWT interceptor, authApi
│   │   └── presentation/                   # Components, Pages (Login, Register, Dashboard), Styles
│   ├── vite.config.ts                     # Cấu hình Proxy /api -> http://localhost:8080
│   └── package.json
│
└── docs/                                   # Tài liệu đặc tả kỹ thuật và nghiệp vụ chính thức
```

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy Nhanh

### 1. Yêu cầu Môi trường
- **Java:** JDK 21 LTS
- **Cơ sở dữ liệu:** PostgreSQL 18 (Cổng mặc định `5432`)
- **Maven:** 3.9+ (hoặc Maven tích hợp trong IDE)
- **Node.js:** v18+ & npm

### 2. Cấu hình Cơ sở Dữ liệu
Tạo cơ sở dữ liệu trên PostgreSQL:
```sql
CREATE DATABASE aives_db;
```

Cấu hình thông tin kết nối qua file `.env` (xem mẫu tại [`.env.example`](.env.example)):
```bash
DB_URL=jdbc:postgresql://localhost:5432/aives_db
DB_USERNAME=postgres
DB_PASSWORD=123456
SERVER_PORT=8080
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=86400000
```

### 3. Khởi chạy Backend
```bash
mvn spring-boot:run -f backend/pom.xml
```
* **Flyway** sẽ tự động migrate 18 bảng và nạp vai trò `ADMIN`, `LECTURER`, `STUDENT`.
* **DataInitializer** tự động cập nhật mật khẩu mã hóa BCrypt cho các tài khoản mẫu.
* **Swagger UI API:** 👉 **[http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)**

### 4. Khởi chạy Frontend
```bash
cd frontend
npm install
npm run dev
```
* Giao diện người dùng sẽ chạy tại: 👉 **[http://localhost:5173](http://localhost:5173)**
* Proxy ngầm tự động điều hướng các request `/api` sang Backend port `8080`.

### 5. Tài khoản Kiểm thử Mặc định
* **Sinh viên:** `an.tv.se170001@fpt.edu.vn` (hoặc MSSV `an.tv.se170001`) — Mật khẩu: `123456`
* **Giảng viên:** `gv.nguyen@fpt.edu.vn` — Mật khẩu: `123456`
* **Quản trị viên:** `admin@aives.edu.vn` — Mật khẩu: `123456`
