# Bổ sung chức năng và kiểm chứng — 20/10/2026

## Đã bổ sung

- Cấu hình Admin lưu PostgreSQL và áp dụng model/temperature cho yêu cầu AI tiếp theo.
- Nhật ký API thật: người thao tác, thời điểm, đường dẫn, kết quả; không lưu nội dung
  mật khẩu/token/bài thi vào nhật ký. Loại bỏ các bảng cấu hình và audit mô phỏng.
- Thời gian trả lời riêng cho mỗi câu chính/lượt hỏi phụ, có kiểm tra backend và
  không đặt lại khi tải lại trang. Kỳ thi mới có trường 15–600 giây/lượt, mặc định 120.
- Transcript tải file .txt thật có kiểm tra quyền, bao gồm hội thoại và điểm cuối đã duyệt.
- STT hiển thị bản chép tạm thời; chọn giọng đọc tiếng Việt khi trình duyệt cung cấp.
- Ghi âm tùy chọn sau khi đồng ý, tải từng đoạn ~10 giây, phát lại có xác thực.
- Giới hạn 2MB/đoạn và 50MB/ca, giữ mặc định 30 ngày; xóa khi hết hạn hoặc rút đồng ý.
- Truy xuất tài liệu theo chủ đề bằng BM25, lưu chỉ mục từ khóa trong PostgreSQL,
  xem trước nguồn và đưa các đoạn liên quan vào prompt sinh câu hỏi.

## Kiểm chứng thực tế

Chrome sử dụng microphone/camera giả lập, không thu giọng nói thật của người dùng.
Backend và PostgreSQL localhost thật; ca test riêng:
TEST-HARDENING-1792499026492 — d036bd75-72ab-41b6-9161-6a88a3eeca44.

- Bộ đếm 120 giây/lượt hiển thị và câu trả lời được lưu khi nộp bài.
- 3 đoạn âm thanh, tổng 431.793 byte, đã lưu PostgreSQL.
- Ghép các đoạn và phát lại: audio.readyState=4, mediaError=null.
- Transcript tải được, chứa đúng câu trả lời tổng hợp về mock repository.
- Truy xuất “dependency injection” trả đoạn nguồn trang 1.
- Trang Admin hiển thị đúng bảng người dùng; cấu hình đọc/lưu giá trị hiện tại thành công.
- Nhật ký hiển thị thao tác ghi âm và lưu cấu hình thực tế.
- Bài test chưa gửi AI chấm hoặc duyệt điểm cuối.

## Giới hạn cần trình bày rõ

- Truy xuất hiện là từ khóa/BM25; chưa có semantic embedding hoặc pgvector.
- STT/TTS phụ thuộc trình duyệt và giọng cài trên máy. Chưa đo WER tiếng Việt chuyên ngành
  trên giọng nói thực tế, không tuyên bố một tỷ lệ chính xác khi chưa đo.
- Chưa chạy kiểm thử tải nhiều sinh viên đồng thời hoặc cam kết SLA độ trễ Gemini.
- Chỉ ghi âm, không ghi video; các đoạn chưa tải thành công chưa được lưu bền vững khi
  đóng tab. Ghi âm không phải điều kiện bắt buộc để nộp câu trả lời văn bản.
- Chưa OCR PDF scan. Chọn PDF có chữ hoặc OCR trước khi tải.
- Transcript xuất .txt; không gắn nhãn là PDF khi chưa có xuất PDF.

## Demo các phần mới

1. Admin → Cấu hình: để model trống nếu muốn dùng AI_MODEL hiện có, lưu cấu hình.
2. Admin → Nhật ký: xem thao tác thật, không còn số liệu online/uptime mẫu.
3. Giảng viên → Ngân hàng: nhập chủ đề, xem trích đoạn rồi sinh câu hỏi.
4. Tạo kỳ thi MỚI, chọn thời gian mỗi lượt 120 giây, xếp ca mới.
5. Sinh viên vào thi: đọc câu hỏi, thử nhập giọng nói, gửi câu trả lời để AI hỏi tiếp.
6. Nếu muốn lưu âm thanh: chọn đồng ý rồi Bật ghi âm; kiểm tra trạng thái các đoạn đã lưu.
7. Nộp bài, AI chấm, giảng viên xem transcript/bản ghi và duyệt điểm cuối.
8. Sinh viên → Lịch sử → chi tiết bài: tải transcript .txt, nghe hoặc xóa bản ghi.


## Kết quả kiểm thử tự động cuối đợt

- Toàn bộ backend: 98 lượt chạy, 0 failures, 0 errors (bao gồm các lượt kiểm thử kế thừa).
- Kiểm thử bổ sung cấu hình động: request thực tới HTTP server giả lập dùng model và
  temperature trong cấu hình, không đổi AI_MODEL nền hoặc lộ key.
- Frontend: 5 kiểm thử qua, bao gồm giữ chủ đề truy xuất khi chia/tiếp tục các đợt.
- Build Vite và git diff --check qua.
- Sau tối ưu pool HTTP và header tải file, chạy lại nhóm AiClientTest và
  HardeningIntegrationTest để kiểm tra cấu hình Spring và các API mới.


Kiểm tra provider cuối đợt: gemini-3.1-flash-lite trả HTTP 503 quá tải sau 1.353 ms.
Đây là phản hồi provider, không phải kiểm thử backend thất bại. Không đổi model hay
API key để che lỗi; chưa thể cam kết độ sẵn sàng/thời gian phản hồi của Gemini.
Nhóm kiểm thử tập trung sau chỉnh sửa cuối: 41 lượt qua, 0 lỗi.
