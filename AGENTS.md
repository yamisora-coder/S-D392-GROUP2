# AGENTS.md — Hướng dẫn Phát triển Dành cho Các AI Agent & Lập trình viên

**Dự án:** AI-powered Viva Exam System (AIVES)  
**Kho mã nguồn:** `yamisora-coder/S-D392-GROUP2`  
**Thư mục làm việc:** `f:\SWD\SWD`  
**Miền nghiệp vụ:** Hệ thống Thi Vấn đáp Trực tuyến Tự động với Giám khảo Trợ lý AI và Giảng viên Chốt Điểm (Human-in-the-Loop)  

---

## 1. Mục đích & Phạm vi Dự án

AIVES là hệ thống khảo thí thông minh được xây dựng nhằm hỗ trợ giảng viên và sinh viên trong việc tổ chức, quản lý và đánh giá các kỳ thi vấn đáp (viva voce examination). Hệ thống bao gồm:
- Quản lý Ngân hàng Câu hỏi chuẩn hóa theo Thang đo nhận thức Bloom.
- Sinh câu hỏi tự động bằng AI (RAG) dựa trên tài liệu học tập của môn học.
- Vận hành phòng thi vấn đáp trực tuyến tích hợp phát âm câu hỏi (TTS), ghi âm và nhận diện giọng nói (STT).
- Tự động đặt câu hỏi đào sâu thích ứng (Adaptive follow-up questions) trong ca thi.
- Đề xuất chẩn đoán chấm điểm với nguyên tắc bất biến **Con người Quyết định (Human-in-the-Loop)**: Giảng viên luôn là người duy nhất nắm quyền phê duyệt điểm số chính thức.

---

## 2. Thứ bậc Chân lý của Tài liệu Dự án (Priority Order)

Khi làm việc trên dự án này, mọi lập trình viên và AI Agent bắt buộc phải tuân thủ nghiêm ngặt thứ tự ưu tiên chân lý:
1. **Thiết kế Cơ sở Dữ liệu Chuẩn:** (`docs/database.md`, `backend/src/main/resources/db/migration/V1__initial_schema.sql`).
2. **Đặc tả Ca sử dụng & Luồng Nghiệp vụ:** (`docs/use-cases.md`).
3. **Hợp đồng REST API & Đặc tả AI:** (`docs/api-contract.md`, `docs/ai-specification.md`).
4. **Mã nguồn Hiện có đang chạy:** (Baseline đang hoạt động).

> **Quy tắc Bất biến:** Tuyệt đối không tự ý bịa đặt yêu cầu, không tự thêm bảng hoặc cột vào CSDL nếu không có trong tài liệu thiết kế chính thức.

---

## 3. Ngăn xếp Công nghệ & Môi trường Hệ thống

- **Backend:** Java 21 LTS, Spring Boot 3.3.4 (Spring Data JPA, Hibernate ORM 6.5, Spring Validation, SpringDoc OpenAPI 2.6.0).
- **Cơ sở dữ liệu:** PostgreSQL 18 (`aives_db`), cổng kết nối mặc định `5432`.
- **Công cụ Build:** Apache Maven 3.9+.
- **Frontend (Mục tiêu):** React / Vite / TypeScript (Sẽ triển khai trong các giai đoạn tiếp theo).
- **Dịch vụ AI / Giọng nói (Mục tiêu):** TBD (Chờ nhóm lựa chọn: OpenAI / Spring AI / Gemini / Web Speech API).

---

## 4. Quy tắc An toàn Git, Bí mật & Biến Môi trường

1. **Tuyệt đối Không Commit Thông tin Bí mật:** Mật khẩu, API key, token truy cập tuyệt đối **KHÔNG ĐƯỢC PHÉP** ghi cứng vào file `application.properties`, mã nguồn hoặc bất kỳ file nào được Git theo dõi.
2. **Sử dụng Biến Môi trường:** Toàn bộ thông tin xác thực phải được đọc từ biến môi trường:
   - `DB_URL` (mặc định: `jdbc:postgresql://localhost:5432/aives_db`)
   - `DB_USERNAME` (mặc định: `postgres`)
   - `DB_PASSWORD` (mặc định: rỗng / ghi đè trên máy cục bộ)
   - `SERVER_PORT` (mặc định: `8080`)
   - `JWT_SECRET` (chuỗi khóa bí mật ký token HMAC-SHA, tối thiểu 256-bit — bắt buộc cho module Auth)
   - `JWT_EXPIRATION_MS` (thời hạn sống của JWT token tính bằng mili-giây, mặc định: `86400000` = 24 giờ)
3. **Vệ sinh Git:** Mật khẩu thực tế chỉ được lưu trong file `.env` cục bộ (đã được bỏ qua bởi `.gitignore`). Chỉ có file `.env.example` chứa các giá trị mẫu giả định mới được đưa lên Git.
4. **Cấm các Thao tác Git Phá hủy:** Không dùng `git reset --hard`, `git push --force` hoặc xóa nhánh khi chưa có sự đồng ý rõ ràng.

---

## 5. Quy tắc Kiến trúc & Lập trình (Coding Guidelines)

1. **Bảo tồn Trạng thái Hoạt động Hiện tại:** Không thay thế hoặc xóa bỏ các mô-đun đang chạy ổn định nếu không có kế hoạch và lý do chính đáng.
2. **Kiến trúc Clean / Onion Chuẩn (Clean / Onion Architecture):**
   - **`domain` (Lõi Nghiệp vụ - Core Domain):**
     - `domain.model`: Thực thể nghiệp vụ cốt lõi (18 JPA entities).
     - `domain.enums`: Định danh danh mục nghiệp vụ (`RoleEnum`, `BloomLevel`, `QuestionSource`, `QuestionStatus`, `TurnType`).
     - `domain.exception`: Các ngoại lệ đặc thù miền nghiệp vụ (`ResourceNotFoundException`, `BadRequestException`, `AppException`, v.v.).
   - **`application` (Tầng Ca sử dụng - Use Cases):**
     - `application.port.in`: Input Ports (Giao diện Use Case / Service contracts).
     - `application.port.out`: Output Ports (Giao diện Spring Data JPA Repositories / Cổng giao tiếp ngoài).
     - `application.service`: Triển khai các Use Case logic nghiệp vụ (`@Transactional`).
     - `application.dto.request` & `application.dto.response`: Mô hình dữ liệu API độc lập có kiểm tra ràng buộc (`@Valid`, `@NotBlank`, v.v.).
   - **`infrastructure` (Tầng Hạ tầng Kỹ thuật - Infrastructure & Adapters):**
     - `infrastructure.config`: Cấu hình hệ thống, Swagger/OpenAPI, CORS, Bean dùng chung, DataInitializer.
     - `infrastructure.security`: Spring Security, bộ lọc JWT, giải mã Token, UserDetails (Phase 1B).
     - `infrastructure.external`: Bộ điều hợp dịch vụ bên ngoài (LLM AI, STT/TTS, Lưu trữ tệp).
   - **`presentation` (Tầng Trình bày - Presentation / Web Adapters):**
     - `presentation.controller`: Các điểm cuối REST API, mã hóa HTTP status chuẩn, chú thích OpenAPI.
     - `presentation.advice`: Xử lý lỗi tập trung (`GlobalExceptionHandler`).
     - `presentation.dto`: Khuôn mẫu phản hồi API thống nhất (`ApiResponse<T>`).
3. **Nguyên tắc Giảng viên Quyết định (Human-in-the-Loop):** Điểm số gợi ý và nhận xét của AI (`ai_grading_suggestion`) chỉ mang tính chất tư vấn. AI không bao giờ được phép tự động phê duyệt điểm chính thức mà không có giảng viên duyệt.
4. **Mô hình Lượt Vấn đáp (Turn-based):** Tiến trình thi vấn đáp diễn ra theo lượt (`session_turn`). Câu hỏi chính và câu hỏi phụ duy trì quan hệ cây phân cấp và kiểm soát nghiêm ngặt thời gian đếm ngược cùng số lượt hỏi tối đa.

---

## 6. Quy trình 5 Bước Khi Thay đổi Mã nguồn

Đối với mọi thay đổi quan trọng, lập trình viên và AI agent phải tuân thủ chu trình 5 bước:
1. **Kiểm tra (Inspect):** Đối soát mã nguồn hiện có và các tài liệu thiết kế chính thức.
2. **Lập kế hoạch (Plan):** Lên kế hoạch chi tiết, đánh giá tác động đến schema CSDL và các API.
3. **Thực thi (Implement):** Chỉnh sửa mã nguồn tập trung, gọn gàng, tuân thủ đúng quy ước dự án.
4. **Kiểm thử (Test & Verify):** Biên dịch (`mvn compile`), chạy kiểm thử, xác nhận Swagger UI và phản hồi API.
5. **Kiểm tra Toàn vẹn (Verify):** Xác nhận code biên dịch sạch sẽ, Swagger UI và phản hồi API hoạt động ổn định.

---

## 7. Định nghĩa Hoàn thành (Definition of Done - DoD)

Một nhiệm vụ hoặc tính năng chỉ được coi là "Hoàn thành" (Done) khi và chỉ khi:
- [ ] Mã nguồn biên dịch sạch sẽ, không có lỗi (`BUILD SUCCESS`).
- [ ] Các bài kiểm thử Unit / Integration Test chạy thành công, không gây hồi quy (regression).
- [ ] Ràng buộc toàn vẹn cơ sở dữ liệu (Khóa ngoại, NOT NULL, Cascade) được thỏa mãn đầy đủ.
- [ ] Các điểm cuối API được ghi chú đầy đủ trong Swagger/OpenAPI và kiểm tra thực tế thành công.
- [ ] Không có mật khẩu cứng, API key hoặc file debug rác nào bị bỏ sót lại trong kho mã nguồn.
