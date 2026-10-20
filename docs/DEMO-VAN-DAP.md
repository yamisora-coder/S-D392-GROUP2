# Demo vấn đáp có hỏi xoáy

1. Tải lại giao diện; đăng nhập lại nếu backend vừa khởi động lại.
2. Ở Cổng Giảng viên, tạo kỳ thi với 1 câu chính, 2 câu đào sâu tối đa/câu chính,
   thời lượng 15 phút. Môn học phải có câu hỏi đã duyệt và rubric đủ 10 điểm.
3. Tạo ca thi MỚI cho sinh viên, đặt lịch bắt đầu trong thời gian hiện tại.
   Ca đã bắt đầu trước bản cập nhật hoặc bài đã nộp không dùng để demo tính năng mới.
4. Đăng nhập sinh viên được xếp lịch và mở phòng thi.
5. Bấm “Đọc câu hỏi” để nghe; nhập câu trả lời hoặc bấm “Nhập bằng giọng nói”.
   Cho phép microphone khi trình duyệt yêu cầu. Kiểm tra bản chép trước khi gửi.
6. Bấm “Gửi câu trả lời”. Hệ thống lưu câu trả lời rồi yêu cầu AI đặt câu hỏi xoáy
   dựa trên nội dung vừa trả lời và rubric của câu chính.
7. Trả lời câu hỏi phụ rồi bấm “Gửi câu trả lời”. Tiếp tục đến lượt 2/2.
   Khi hiện “Đã hoàn thành câu này”, chuyển câu tiếp hoặc nộp bài.
8. Bấm “Nộp bài”, sau đó “Gửi AI chấm / Thử lại”. AI xét cả câu trả lời chính
   và câu trả lời phụ theo rubric gốc, không cộng thêm thang điểm mới.
9. Quay lại Cổng Giảng viên → Chấm điểm & Duyệt, mở bài thi để xem hội thoại,
   điểm từng tiêu chí, bằng chứng. Giảng viên kiểm tra, điều chỉnh và duyệt điểm cuối.

Nếu AI bận: câu trả lời đã gửi vẫn được lưu. Bấm “Thử hỏi tiếp” để thử lại;
không cần gửi lại hoặc sửa câu trả lời cũ. Mỗi lượt gọi AI hỏi xoáy chờ tối đa
20 giây; thời gian thi vẫn tiếp tục chạy. Có thể nộp bài khi AI không khả dụng.
Chất lượng giọng đọc/nhận dạng phụ thuộc trình duyệt và giọng tiếng Việt cài trên máy.
Hiện chưa lưu bản ghi âm/video, chỉ lưu nội dung văn bản và thời điểm các lượt.

Kiểm chứng bản cập nhật: Maven có 64 lượt kiểm thử qua (gồm các kiểm thử kế thừa),
frontend Vite build thành công; đã kiểm tra giao diện với API/AI giả lập cho nhánh
lỗi → thử lại → 2 lượt hỏi → nộp bài. Chưa kiểm chứng lượt hỏi xoáy với Gemini thật
hoặc độ chính xác nhận dạng giọng nói trên microphone của người dùng.
