# Kết quả kiểm thử luồng vấn đáp — 20/10/2026

Môi trường: backend localhost:8080, frontend localhost:5173.

| Kiểm tra | Kết quả |
| --- | --- |
| Maven backend | 64 lượt chạy, 0 failures, 0 errors, 0 skipped; gồm 20 lượt kiểm thử kế thừa |
| Frontend Vite build | Thành công |
| git diff --check | Thành công |
| Gemini thật | gemini-3.1-flash-lite, native generateContent |
| Kiểm tra kết nối Gemini | Thành công, 1089 ms |
| Hỏi xoáy lượt 1 | Thành công, 1269 ms |
| Hỏi xoáy lượt 2 | Thành công, 1352 ms |
| Gửi lại yêu cầu khi câu phụ đang chờ trả lời | Trả cùng turn ID, không tạo câu hỏi mới |
| Yêu cầu lượt 3 với giới hạn 2 | Bị chặn HTTP 409 đúng cấu hình |
| Nộp bài | Thành công |
| Chấm AI gồm hội thoại phụ | Thành công, 7781 ms, điểm đề xuất 10/10 |
| Giảng viên xem lại | API trả đủ 2 lượt hỏi đáp |
| Chốt điểm cuối | Chưa duyệt, dành cho giảng viên |

## Ca test thật

Kỳ thi: TEST-AI-HOIXOAY-20261020-183730.
Session ID: a5f48c17-4b60-42cc-9169-975aeaa074e7.
Dữ liệu câu hỏi, rubric và câu trả lời được tạo riêng để test, không lấy từ bài thi cũ.
Có thể mở ca này trong Chấm điểm & Duyệt để kiểm tra hội thoại và rubric.

Câu chính: Giải thích Dependency Injection và lợi ích khi kiểm thử phần mềm.

Câu hỏi phụ 1 do Gemini sinh:
“Bạn hãy giải thích cụ thể cách thức Dependency Injection giúp ích cho việc kiểm thử
phần mềm thông qua việc tách rời các phụ thuộc?”

Sau câu trả lời tổng hợp về constructor injection và mock repository, Gemini hỏi tiếp:
“Vậy nếu một Service cần tương tác với nhiều phiên bản của cùng một Interface,
bạn sẽ làm thế nào để Spring Container chọn đúng implement cần thiết trong quá trình chạy?”

## Phạm vi bảo đảm

Kiểm thử tự động xác nhận lưu câu trả lời khi AI lỗi, thử lại, giới hạn lượt,
quyền sở hữu ca thi, hạn thi, khóa bài đã nộp, không sửa câu trả lời đã gửi,
không nhận câu hỏi/rubric ngoài đề và chấm bằng chứng từ câu trả lời phụ.
Kiểm thử thật xác nhận Gemini đặt câu hỏi liên quan đến nội dung trả lời và trả điểm
đúng cấu trúc trong lần chạy này. Thời gian nêu trên là số đo của lần test,
không bảo đảm nhà cung cấp luôn phản hồi ở tốc độ đó.
Chưa kiểm tra độ chính xác microphone/giọng đọc tiếng Việt trên thiết bị người dùng,
hoặc tải đồng thời nhiều sinh viên.
