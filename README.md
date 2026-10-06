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
- **Java:** JDK 21 LTS (Khuyến nghị cài đặt qua IntelliJ hoặc Eclipse Temurin 21)
- **Cơ sở dữ liệu:** PostgreSQL 14+ / 16 / 18 (Cổng mặc định `5432`)
- **Maven:** 3.9+ (hoặc Maven tích hợp sẵn trong IntelliJ IDEA)
- **Node.js:** v18+ & npm

---

### 2. Thiết lập Cơ sở Dữ liệu (Dành cho Thành viên Nhóm)

> 💡 **Lưu ý cốt lõi:** Bạn **KHÔNG CẦN CHẠY BẤT KỲ FILE SQL NÀO BẰNG TAY!**  
> Dự án sử dụng **Flyway Migration** tự động: khi khởi động backend, hệ thống sẽ tự động tạo đủ 18 bảng, liên kết khóa ngoại và nạp sẵn dữ liệu mẫu cùng các tài khoản thử nghiệm.

#### Bước 2.1: Tạo Database trống trên PostgreSQL
Mở pgAdmin hoặc công cụ dòng lệnh (psql) và chạy duy nhất lệnh sau:
```sql
CREATE DATABASE aives_db;
```

#### Bước 2.2: Cấu hình Mật khẩu kết nối CSDL của máy bạn
Chọn 1 trong 2 cách sau để cấu hình mật khẩu PostgreSQL máy cục bộ của bạn:

* **Cách A (Khuyến nghị khi dùng IntelliJ IDEA):**
  1. Mở file [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties).
  2. Điền mật khẩu PostgreSQL của máy bạn vào dòng:
     ```properties
     spring.datasource.password=mật_khẩu_postgres_của_bạn
     ```
  3. *(Hoặc bấm **Edit Configurations...** của ứng dụng Spring Boot trong IntelliJ $\rightarrow$ Thêm vào ô **Environment variables**: `DB_PASSWORD=mật_khẩu_của_bạn`).*

* **Cách B (Nếu khởi chạy từ Terminal / PowerShell):**
  ```powershell
  # Gán mật khẩu của máy bạn trước khi chạy
  $env:DB_PASSWORD = "mật_khẩu_postgres_của_bạn"
  mvn spring-boot:run -f backend/pom.xml
  ```

---

### 3. Khởi chạy Backend Server
Từ thư mục gốc dự án:
```bash
mvn spring-boot:run -f backend/pom.xml
```
* Hệ thống sẽ tự động tạo bảng qua Flyway (`V1`, `V2`).
* Dữ liệu mẫu (môn học, câu hỏi, tài khoản) sẽ được khởi tạo tự động.
* Truy cập tài liệu API tương tác tại: 👉 **[http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)**

---

### 4. Khởi chạy Frontend Portal
Mở một cửa sổ Terminal mới:
```bash
cd frontend
npm install
npm run dev
```
* Giao diện Portal thi vấn đáp sẽ chạy tại: 👉 **[http://localhost:5173](http://localhost:5173)**
* Mọi request gọi API `/api/*` sẽ được Vite tự động chuyển tiếp tới Backend port `8080`.

---

### 5. Tài khoản Kiểm thử Mặc định (Đã nạp sẵn)
* **Sinh viên:** `an.tv.se170001@fpt.edu.vn` (hoặc MSSV `an.tv.se170001`) — Mật khẩu: `123456`
* **Giảng viên:** `gv.nguyen@fpt.edu.vn` — Mật khẩu: `123456`
* **Quản trị viên:** `admin@aives.edu.vn` — Mật khẩu: `123456`
