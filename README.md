# S-D392-GROUP2 - AI-powered Viva Exam System (AIVES)

Hệ thống Phỏng vấn / Thi Vấn đáp Trí tuệ Nhân tạo thông minh.

## 🚀 Hướng dẫn Chạy Backend (Spring Boot + PostgreSQL)

### 1. Yêu cầu môi trường
- **Java:** JDK 17 hoặc 21 (LTS)
- **Database:** PostgreSQL 18 (hoặc 15+)
- **IDE:** IntelliJ IDEA (khuyên dùng) hoặc VS Code / Eclipse

### 2. Cài đặt CSDL
Mở pgAdmin hoặc terminal PostgreSQL và tạo cơ sở dữ liệu:
```sql
CREATE DATABASE aives_db;
```

### 3. Cấu hình kết nối
Mở file `backend/src/main/resources/application.properties` và chỉnh sửa mật khẩu khớp với máy cá nhân:
```properties
spring.datasource.username=postgres
spring.datasource.password=<mat_khau_postgres_cua_ban>
```

### 4. Khởi chạy ứng dụng
- **Cách 1 (IntelliJ IDEA):** Mở thư mục `backend`, vào `src/main/java/com/group2/aives/AivesApplication.java` và bấm nút **Run ▶️**.
- **Cách 2 (Terminal):**
  ```bash
  cd backend
  mvn spring-boot:run
  ```

### 5. Kiểm tra API qua Swagger UI
Mở trình duyệt truy cập:
👉 **[http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)**
