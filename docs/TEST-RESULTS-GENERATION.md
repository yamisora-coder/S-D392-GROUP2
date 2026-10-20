# Kiểm thử tạo 10 câu hỏi theo đợt — 20/10/2026

Thay đổi: giao diện gửi lần lượt 3+3+3+1 câu, hiển thị số câu đã lưu, hỗ trợ tạm dừng
sau đợt hiện tại và tiếp tục. Mã đợt được lưu cùng tiến độ trong sessionStorage theo
tài khoản. Backend lưu receipt và câu hỏi trong cùng transaction để thử lại không tạo trùng.
Yêu cầu AI được ràng buộc JSON Schema về số lượng câu và 3 tiêu chí rubric.

## Kết quả tự động

- Backend: 68 lượt kiểm thử qua, 0 lỗi (bao gồm các lượt kiểm thử kế thừa).
- Frontend: 4 kiểm thử qua về chia đợt, giữ tiến độ khi lỗi/tải lại, tạm dừng, phản hồi sai.
- Vite build và git diff --check: qua.
- Trình duyệt, API giả lập: lỗi tại đợt thứ hai vẫn giữ 3/10, hiện nút Tiếp tục,
  bấm tiếp tục hoàn tất 10/10 và mở lại các trường cấu hình.

## Gemini thật

Tài liệu test phần mềm tổng hợp, môn TEST-BATCH-20261020-185654.
Chương: e198ee26-52b4-446b-a18a-fb5ea09b4c81.

| Đợt | Kết quả | Thời gian |
| --- | --- | --- |
| 3 câu đầu | Lưu 3/10 | 37,80 giây |
| 3 câu tiếp | Lưu 6/10 | 8,14 giây |
| 3 câu tiếp | Lưu 9/10 | 4,57 giây |
| Câu cuối, lần đầu | Timeout HTTP 504, giữ nguyên 9 câu | 45,05 giây |
| Thử lại riêng câu cuối | Lưu đủ 10/10 | 14,78 giây |

Tổng thời gian các yêu cầu trong lần thử có phục hồi: khoảng 110,48 giây.
Cả 10 câu có ID riêng, trạng thái DRAFT và tổng rubric 10 điểm.
Gửi lại đợt đầu với cùng batchId trả cùng kết quả, không tạo thêm câu hỏi.
Trước khi thêm schema, Gemini từng trả sai số lượng; đợt đó không lưu câu nào.

Đây là cải thiện thời gian thấy kết quả và khả năng giữ/tiếp tục công việc;
không phải bảo đảm mọi lần tạo 10 câu đều nhanh hoặc không gặp lỗi provider.
Không đo so sánh trước/sau trên cùng tải provider nên chưa kết luận giảm tổng thời gian.
Câu hỏi diễn đạt khác nhưng cùng ý vẫn cần giảng viên xem lại; kiểm tra trùng tự động
chặn nội dung giống nhau sau chuẩn hóa, không phải hệ thống so khớp ngữ nghĩa.

## Sử dụng

Tải lại trang → Ngân hàng & Rubric AI → Tạo từ tài liệu → chọn 10 → Tạo câu hỏi.
Theo dõi 3/10, 6/10, 9/10, 10/10. Nếu báo lỗi, bấm Tiếp tục, không bắt đầu lại.
Có thể tải lại cùng tab rồi mở Tạo từ tài liệu để tiếp tục tiến độ còn lưu.
Kết thúc đợt chỉ bỏ phần tiến độ còn lại; các câu đã lưu vẫn ở Chờ duyệt.
