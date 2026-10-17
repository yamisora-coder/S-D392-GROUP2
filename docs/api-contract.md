# AIVES — Hợp đồng Đặc tả Giao diện Lập trình (API Contract Specification)

Tài liệu này đặc tả hợp đồng REST API cho hệ thống **AI-powered Viva Exam System (AIVES)**.
Tài liệu phân định rạch ròi giữa **API HIỆN TẠI (CURRENT API)** (đang chạy thực tế trên nền Spring Boot 3.3.4) và **API MỤC TIÊU (TARGET API)** (được thiết kế theo Use Cases và ERD 18 bảng, được gắn nhãn Kế hoạch / Chưa triển khai).

---

## 1. API HIỆN TẠI (CURRENT API — Đang hoạt động)

Địa chỉ máy chủ cơ sở (Base URL): `http://localhost:8080`  
Tài liệu tương tác OpenAPI / Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### 1.1 Nhóm API Môn học (`/api/subjects`)
| Phương thức | Điểm cuối (Endpoint) | Mô tả nghiệp vụ | Dữ liệu gửi lên (Request Body) | Dữ liệu trả về (Success) |
|---|---|---|---|---|
| `GET` | `/api/subjects` | Lấy danh sách toàn bộ môn học | Không | `200 OK` Danh sách `SubjectResponse` |
| `GET` | `/api/subjects/{id}` | Lấy chi tiết môn học theo UUID | Không | `200 OK` `SubjectResponse` (hoặc `404`) |
| `POST` | `/api/subjects` | Tạo môn học mới | `SubjectRequest` (`code`, `name`, `description`) | `201 Created` `SubjectResponse` |
| `PUT` | `/api/subjects/{id}` | Cập nhật thông tin môn học | `SubjectRequest` | `200 OK` `SubjectResponse` |
| `DELETE` | `/api/subjects/{id}` | Xóa môn học theo UUID | Không | `204 No Content` |

### 1.2 Nhóm API Ngân hàng Câu hỏi (`/api/questions`)
| Phương thức | Điểm cuối (Endpoint) | Mô tả nghiệp vụ | Dữ liệu gửi lên (Request Body) | Dữ liệu trả về (Success) |
|---|---|---|---|---|
| `GET` | `/api/questions` | Lấy danh sách câu hỏi (tùy chọn lọc: `?subjectId=...`) | Không | `200 OK` Danh sách `QuestionResponse` |
| `GET` | `/api/questions/{id}` | Lấy chi tiết câu hỏi theo UUID | Không | `200 OK` `QuestionResponse` (hoặc `404`) |
| `POST` | `/api/questions` | Tạo câu hỏi kèm tiêu chí rubric nhúng | `QuestionRequest` (`content`, `type`, `sampleAnswer`, `subjectId`, `rubric`) | `201 Created` `QuestionResponse` |
| `PUT` | `/api/questions/{id}` | Cập nhật câu hỏi và tiêu chí rubric | `QuestionRequest` | `200 OK` `QuestionResponse` |
| `DELETE` | `/api/questions/{id}` | Xóa câu hỏi theo UUID | Không | `204 No Content` |

### 1.3 Nhóm API Quản lý Kỳ thi (`/api/exams`)
| Phương thức | Điểm cuối (Endpoint) | Mô tả nghiệp vụ | Dữ liệu gửi lên (Request Body) | Dữ liệu trả về (Success) |
|---|---|---|---|---|
| `GET` | `/api/exams` | Lấy danh sách toàn bộ kỳ thi | Không | `200 OK` Danh sách `ExamResponse` |
| `GET` | `/api/exams/{id}` | Lấy chi tiết kỳ thi theo UUID | Không | `200 OK` `ExamResponse` (hoặc `404`) |
| `POST` | `/api/exams` | Tạo kỳ thi mới | `ExamRequest` (`subjectId`, `title`, `durationPerStudentMins`, `maxMainQuestions`, `maxFollowupQuestions`) | `201 Created` `ExamResponse` |
| `PUT` | `/api/exams/{id}` | Cập nhật kỳ thi | `ExamRequest` | `200 OK` `ExamResponse` |
| `DELETE` | `/api/exams/{id}` | Xóa kỳ thi theo UUID | Không | `204 No Content` |

### 1.4 Nhóm API Ca thi & Chấm điểm (`/api/sessions`)
| Phương thức | Điểm cuối (Endpoint) | Mô tả nghiệp vụ | Dữ liệu gửi lên (Request Body) | Dữ liệu trả về (Success) |
|---|---|---|---|---|
| `GET` | `/api/sessions` | Lấy danh sách tất cả các ca thi | Không | `200 OK` Danh sách `SessionResponse` |
| `GET` | `/api/sessions/exam/{examId}` | Lấy danh sách ca thi của một kỳ thi | Không | `200 OK` Danh sách `SessionResponse` |
| `POST` | `/api/sessions` | Xếp lịch thi cho một sinh viên | `SessionRequest` (`examId`, `studentId`, `scheduledStartTime`) | `201 Created` `SessionResponse` |
| `PATCH`| `/api/sessions/{sessionId}/grade` | Giảng viên chốt điểm và nhận xét (Human-in-the-loop) | `GradeSubmissionRequest` (`finalScore`, `feedback`) | `200 OK` `SessionResponse` |
| `DELETE`| `/api/sessions/{sessionId}` | Xóa ca thi | Không | `204 No Content` |

### 1.5 Nhóm API Người dùng (`/api/users`)
| Phương thức | Điểm cuối (Endpoint) | Mô tả nghiệp vụ | Dữ liệu gửi lên (Request Body) | Dữ liệu trả về (Success) |
|---|---|---|---|---|
| `GET` | `/api/users` | Lấy danh sách người dùng (tùy chọn lọc: `?role=ADMIN\|LECTURER\|STUDENT` — *prototype cũ dùng INSTRUCTOR, sẽ chuyển chuẩn LECTURER theo ERD*) | Không | `200 OK` Danh sách `UserResponse` |

---

## 2. API MỤC TIÊU (TARGET API — Kế hoạch / Chưa triển khai)

Các điểm cuối dưới đây được thiết kế theo đúng quy trình nghiệp vụ trong Use Cases, Swimlanes và ERD 18 bảng.

### 2.1 Nhóm API Xác thực & Phân quyền (`/api/auth`)
*Trạng thái: KẾ HOẠCH / CHƯA TRIỂN KHAI*
- `POST /api/auth/login`: Xác thực bằng email/mật khẩu, trả về JWT token cùng danh sách vai trò.
- `POST /api/auth/register`: Đăng ký tài khoản người dùng mới.
- `GET /api/auth/me`: Lấy thông tin cá nhân và quyền hạn của người dùng đang đăng nhập.

### 2.2 Nhóm API Quản lý Môn học & Tài liệu Học tập (`/api/courses`)
*Trạng thái: KẾ HOẠCH / CHƯA TRIỂN KHAI*
- `POST /api/courses/{id}/documents`: Tải lên tài liệu giáo trình/slide (`multipart/form-data`) -> lưu vào bảng `course_document`.
- `GET /api/courses/{id}/documents`: Lấy danh sách tài liệu học tập của môn học.
- `DELETE /api/courses/{id}/documents/{docId}`: Xóa tài liệu khỏi môn học.

### 2.3 Nhóm API Sinh Câu hỏi bằng AI & Phê duyệt (`/api/questions`)
*Trạng thái: KẾ HOẠCH / CHƯA TRIỂN KHAI*
- `POST /api/questions/generate`: Khởi tạo tiến trình RAG sinh câu hỏi (`topic`, `bloom_level`, `target_count`, `document_ids`) -> tạo `question_generation_request`.
- `GET /api/questions/generation-requests/{requestId}`: Kiểm tra trạng thái tiến trình sinh câu hỏi (`PROCESSING`, `COMPLETED`, `FAILED`).
- `PUT /api/questions/{id}/approve`: Giảng viên phê duyệt câu hỏi nháp -> cập nhật trạng thái `APPROVED` và ghi nhận `reviewed_by`.
- `PUT /api/questions/{id}/reject`: Giảng viên từ chối câu hỏi.

### 2.4 Nhóm API Quản lý Rubric Độc lập (`/api/rubrics`)
*Trạng thái: KẾ HOẠCH / CHƯA TRIỂN KHAI*
- `GET /api/rubrics`: Lấy danh sách các bộ rubric chuẩn.
- `POST /api/rubrics`: Tạo bộ rubric mới (`name`, `description`).
- `POST /api/rubrics/{id}/criteria`: Bổ sung tiêu chí con (`criterion_name`, `max_score`, `expected_answer_keywords`).
- `PUT /api/rubrics/{id}/criteria/{criterionId}`: Cập nhật tiêu chí con.
- `DELETE /api/rubrics/{id}/criteria/{criterionId}`: Xóa tiêu chí con.

### 2.5 Nhóm API Gán Câu hỏi vào Đề thi (`/api/exams/{id}/questions`)
*Trạng thái: KẾ HOẠCH / CHƯA TRIỂN KHAI*
- `POST /api/exams/{id}/questions`: Gán câu hỏi vào đề thi kèm thứ tự hỏi (`question_order`) -> tạo bản ghi `exam_question`.
- `GET /api/exams/{id}/questions`: Lấy danh sách câu hỏi đã sắp xếp thứ tự của đề thi.
- `DELETE /api/exams/{id}/questions/{questionId}`: Hủy gán câu hỏi khỏi đề thi.

### 2.6 Nhóm API Điều phối Phòng thi Vấn đáp AI Viva Core (`/api/viva`)
*Trạng thái: KẾ HOẠCH / CHƯA TRIỂN KHAI*
- `POST /api/viva/sessions/{sessionId}/start`: Khởi tạo ca thi vấn đáp, kích hoạt lượt hỏi đầu tiên.
- `POST /api/viva/turns/{turnId}/audio`: Tải file ghi âm câu trả lời của thí sinh (`multipart/form-data`) -> kích hoạt STT và ghi vào `transcript`.
- `GET /api/viva/turns/{turnId}/transcript`: Lấy văn bản transcript nhận diện được theo thời gian thực.
- `POST /api/viva/turns/{turnId}/evaluate-followup`: Kích hoạt AI đánh giá câu trả lời để quyết định hỏi thêm câu hỏi phụ thích ứng.
- `GET /api/viva/turns/{turnId}/tts`: Lấy luồng âm thanh phát âm câu hỏi qua dịch vụ TTS.
- `POST /api/viva/sessions/{sessionId}/finish`: Kết thúc ca thi và kích hoạt tiến trình chấm điểm của AI.

### 2.7 Nhóm API Bảng điều khiển Chấm điểm Giảng viên (`/api/grading`)
*Trạng thái: KẾ HOẠCH / CHƯA TRIỂN KHAI*
- `GET /api/grading/sessions/{sessionId}`: Lấy trọn bộ hồ sơ ca thi phục vụ giảng viên thẩm định:
  - Toàn bộ transcript chi tiết (câu hỏi chính và các câu hỏi phụ).
  - URL phát lại âm thanh ghi âm thực tế của từng lượt.
  - Phân tích điểm gợi ý, điểm mạnh, điểm yếu, ý còn thiếu của AI (`ai_grading_suggestion`).
  - Tiêu chí rubric tương ứng.
- `POST /api/grading/sessions/{sessionId}/confirm`: Giảng viên lưu điểm chính thức, nhận xét sư phạm và công bố kết quả (`final_grade` và `exam_result`).
