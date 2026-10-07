# AIVES Backend

Backend Spring Boot cho **AIVES - AI-powered Viva Exam System**.

## Công nghệ

- Java 21
- Spring Boot 3.3.4
- Spring Web, Spring Data JPA, Spring Security
- PostgreSQL
- Flyway
- JWT
- Swagger/OpenAPI

## Yêu cầu

- JDK 21.
- Maven 3.9+ hoặc Maven wrapper nếu repository có bổ sung wrapper.
- PostgreSQL đang chạy ở cổng `5432`.

## 1. Tạo database PostgreSQL

Đăng nhập PostgreSQL bằng pgAdmin hoặc `psql`, sau đó tạo database:

```sql
CREATE DATABASE aives_db;
```

Mặc định backend dùng:

```text
Host: localhost
Port: 5432
Database: aives_db
Username: postgres
```

## 2. Cấu hình backend

File cấu hình mặc định:

```text
src/main/resources/application.properties
```

Các thuộc tính quan trọng:

```properties
server.port=8080
spring.datasource.url=jdbc:postgresql://localhost:5432/aives_db
spring.datasource.username=postgres
spring.datasource.password=your-postgres-password
jwt.secret=your-secret
jwt.expiration-ms=86400000
```

Không commit mật khẩu database hoặc JWT secret. Có thể ghi đè bằng biến môi trường:

```powershell
$env:SPRING_DATASOURCE_PASSWORD="your-postgres-password"
$env:JWT_SECRET="a-long-random-secret"
$env:JWT_EXPIRATION_MS="86400000"
```

Tên biến môi trường của Spring tương ứng với:

```text
spring.datasource.password -> SPRING_DATASOURCE_PASSWORD
jwt.secret                 -> JWT_SECRET
jwt.expiration-ms          -> JWT_EXPIRATION_MS
```

## 3. Chạy migration và backend

Từ thư mục `backend`:

```bash
mvn clean spring-boot:run
```

Hoặc build file JAR:

```bash
mvn clean package
java -jar target/aives-0.0.1-SNAPSHOT.jar
```

Khi khởi động, Flyway tự chạy các migration trong:

```text
src/main/resources/db/migration
```

JPA đang dùng `ddl-auto=validate`, vì vậy schema database phải khớp migration. Không tự sửa bảng bằng cách bật `ddl-auto=create` hoặc `update` trong môi trường dùng dữ liệu thật.

## 4. Kiểm tra backend

API gốc:

```text
http://localhost:8080
```

Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```

OpenAPI JSON:

```text
http://localhost:8080/v3/api-docs
```

## API chính

```text
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/me

GET/POST /api/courses
GET/POST /api/questions
GET/POST /api/rubrics
GET/POST /api/exams
GET/POST /api/sessions
GET      /api/users
```

Các API cần JWT phải nhận:

```http
Authorization: Bearer <token>
```

## Tài khoản và role

Migration `V2__seed_master_roles.sql` chỉ tạo ba role:

```text
ADMIN
LECTURER
STUDENT
```

Migration này không tự tạo tài khoản người dùng. Cần tạo user bằng API đăng ký, script seed riêng hoặc công cụ quản trị database. Không đặt mật khẩu tài khoản thật trong README hoặc source code.

## Kết nối frontend

Frontend chạy mặc định tại `http://localhost:5173`. Tạo `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Nếu frontend bị CORS, kiểm tra cấu hình Security/CORS ở backend và cho phép origin frontend.

## Forgot-password

Frontend hiện gọi:

```text
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

Backend cần triển khai thêm đầy đủ:

- Tạo reset token ngẫu nhiên, có thời hạn và dùng một lần.
- Lưu token dạng an toàn, không lưu mật khẩu dạng plain text.
- Gửi email qua SMTP hoặc email provider.
- Tạo link về frontend dạng `/reset-password?token=...`.
- Không tiết lộ email có tồn tại trong response.

Nếu backend chưa có hai endpoint này, chức năng forgot-password trên frontend sẽ trả `404`.

## Lỗi thường gặp

### Không kết nối được PostgreSQL

- Kiểm tra PostgreSQL service đang chạy.
- Kiểm tra database `aives_db` đã tồn tại.
- Kiểm tra username/password trong `application.properties`.
- Kiểm tra cổng `5432`.

### Lỗi Flyway hoặc schema validation

- Không xóa migration đã chạy trên database dùng chung.
- Kiểm tra lịch sử trong bảng `flyway_schema_history`.
- Đảm bảo schema khớp với entity và migration.

### `400` khi tải courses

Kiểm tra transaction ở service khi map các quan hệ JPA lazy. Backend đã tắt `open-in-view`, nên không truy cập quan hệ lazy sau khi transaction kết thúc.

### `401` hoặc `403`

- Gửi đúng Bearer token.
- Kiểm tra token còn hạn.
- Kiểm tra role và rule trong Spring Security.

## Kiểm tra trước khi bàn giao

```bash
mvn test
mvn clean package
```

Sau đó kiểm tra thủ công login, logout, `/api/auth/me`, Swagger, các API protected và kết nối frontend.

## Giới hạn hiện tại

- Chưa có đầy đủ API lưu transcript/audio từng câu nếu chưa được bổ sung.
- AI follow-up và AI scoring cần service/endpoint AI riêng.
- Giảng viên phải là người chốt điểm cuối; backend không nên coi điểm AI là điểm chính thức.
- Cần bổ sung chính sách lưu/xóa audio, transcript và audit log trước khi triển khai production.
