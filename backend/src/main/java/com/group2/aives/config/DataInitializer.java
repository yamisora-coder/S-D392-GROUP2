package com.group2.aives.config;

import com.group2.aives.entity.*;
import com.group2.aives.entity.enums.*;
import com.group2.aives.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;
    private final ExamSessionRepository examSessionRepository;

    @Override
    public void run(String... args) {
        if (subjectRepository.count() > 0) {
            log.info("Dữ liệu đã tồn tại trong CSDL aives_db, bỏ qua bước khởi tạo mẫu.");
            return;
        }

        log.info("Bắt đầu nạp dữ liệu mẫu cho hệ thống AIVES...");

        // 1. Tạo Users mẫu
        User instructor = userRepository.save(User.builder()
                .email("gv.nguyen@fpt.edu.vn")
                .fullName("ThS. Nguyễn Văn Giảng")
                .role(Role.INSTRUCTOR)
                .code("GV001")
                .build());

        User student1 = userRepository.save(User.builder()
                .email("an.tv.se170001@fpt.edu.vn")
                .fullName("Trần Văn An")
                .role(Role.STUDENT)
                .code("SE170001")
                .build());

        User student2 = userRepository.save(User.builder()
                .email("binh.lt.se170002@fpt.edu.vn")
                .fullName("Lê Thị Bình")
                .role(Role.STUDENT)
                .code("SE170002")
                .build());

        User student3 = userRepository.save(User.builder()
                .email("cuong.pm.se170003@fpt.edu.vn")
                .fullName("Phạm Minh Cường")
                .role(Role.STUDENT)
                .code("SE170003")
                .build());

        // 2. Tạo Môn học mẫu
        Subject swe201 = subjectRepository.save(Subject.builder()
                .code("SWE201")
                .name("Kỹ thuật Phần mềm (Software Engineering)")
                .description("Môn học nền tảng về quy trình phát triển phần mềm, kiến trúc hệ thống và thiết kế mẫu.")
                .build());

        Subject prn231 = subjectRepository.save(Subject.builder()
                .code("PRN231")
                .name("Xây dựng Web API & Lập trình Phân tán")
                .description("Phát triển các hệ thống Backend RESTful API, kiến trúc phân tán và tích hợp dịch vụ.")
                .build());

        // 3. Tạo Ngân hàng Câu hỏi & Rubric theo thang Bloom
        // Câu 1: REMEMBER (Nhớ)
        Question q1 = Question.builder()
                .subject(swe201)
                .content("Nêu định nghĩa và 4 tính chất cơ bản của lập trình hướng đối tượng (OOP)?")
                .sampleAnswer("OOP là phương pháp lập trình dựa trên khái niệm đối tượng và lớp. 4 tính chất: Đóng gói (Encapsulation), Kế thừa (Inheritance), Đa hình (Polymorphism), Trừu tượng (Abstraction).")
                .bloomLevel(BloomLevel.REMEMBER)
                .status(QuestionStatus.APPROVED)
                .createdBy(instructor)
                .build();
        q1.addRubric(QuestionRubric.builder().criteriaName("Nêu đúng định nghĩa OOP").maxScore(2.0).description("Khái niệm đối tượng, lớp và dữ liệu").build());
        q1.addRubric(QuestionRubric.builder().criteriaName("Liệt kê đầy đủ 4 tính chất").maxScore(4.0).description("Đóng gói, Kế thừa, Đa hình, Trừu tượng").build());
        q1.addRubric(QuestionRubric.builder().criteriaName("Giải thích ngắn gọn ý nghĩa từng tính chất").maxScore(4.0).description("Đưa ra được bản chất của từng tính chất").build());
        questionRepository.save(q1);

        // Câu 2: UNDERSTAND (Hiểu)
        Question q2 = Question.builder()
                .subject(swe201)
                .content("Giải thích cơ chế hoạt động của Inversion of Control (IoC) và Dependency Injection (DI)?")
                .sampleAnswer("IoC đảo ngược quyền kiểm soát việc khởi tạo đối tượng cho framework. DI là kỹ thuật truyền đối tượng phụ thuộc vào từ bên ngoài thay vì tự new bên trong class.")
                .bloomLevel(BloomLevel.UNDERSTAND)
                .status(QuestionStatus.APPROVED)
                .createdBy(instructor)
                .build();
        q2.addRubric(QuestionRubric.builder().criteriaName("Phân biệt rõ IoC Container và DI").maxScore(4.0).description("Khái niệm inversion và container quản lý vòng đời bean").build());
        q2.addRubric(QuestionRubric.builder().criteriaName("Trình bày 3 kiểu inject (Constructor, Setter, Field)").maxScore(6.0).description("Lý giải tại sao Constructor Injection được khuyến nghị").build());
        questionRepository.save(q2);

        // Câu 3: APPLY (Vận dụng)
        Question q3 = Question.builder()
                .subject(prn231)
                .content("Khi nào nên sử dụng Database Index và hãy nêu một trường hợp đánh Index sai làm suy giảm hiệu năng truy vấn?")
                .sampleAnswer("Nên dùng Index trên cột thường xuyên tìm kiếm, lọc WHERE, JOIN hoặc ORDER BY. Tránh đánh Index trên bảng nhỏ, cột có tính chọn lọc thấp (ví dụ: giới tính), hoặc bảng ghi chép dữ liệu liên tục (INSERT/UPDATE cao).")
                .bloomLevel(BloomLevel.APPLY)
                .status(QuestionStatus.APPROVED)
                .createdBy(instructor)
                .build();
        q3.addRubric(QuestionRubric.builder().criteriaName("Xác định chính xác các trường hợp nên đánh Index").maxScore(4.0).description("Cột điều kiện lọc, khóa ngoại").build());
        q3.addRubric(QuestionRubric.builder().criteriaName("Phân tích chi phí ghi và trường hợp đánh Index sai").maxScore(6.0).description("Ảnh hưởng đến B-Tree update khi ghi và dung lượng đĩa").build());
        questionRepository.save(q3);

        // Câu 4: ANALYZE (Phân tích)
        Question q4 = Question.builder()
                .subject(prn231)
                .content("So sánh kiến trúc Monolithic và Microservices? Phân tích các tiêu chí: Khả năng mở rộng, Độ phức tạp triển khai, và Xử lý lỗi phân tán?")
                .sampleAnswer("Monolith đơn giản khi phát triển ban đầu nhưng khó scale độc lập. Microservices cho phép scale linh hoạt từng module nhưng đòi hỏi cơ chế đồng bộ dữ liệu, service discovery và distributed tracing phức tạp.")
                .bloomLevel(BloomLevel.ANALYZE)
                .status(QuestionStatus.APPROVED)
                .createdBy(instructor)
                .build();
        q4.addRubric(QuestionRubric.builder().criteriaName("So sánh tổng quan 2 mô hình kiến trúc").maxScore(3.0).description("Cấu trúc code base và cách triển khai").build());
        q4.addRubric(QuestionRubric.builder().criteriaName("Phân tích khả năng mở rộng (Scalability)").maxScore(3.5).description("Scale dọc vs Scale ngang theo tải từng service").build());
        q4.addRubric(QuestionRubric.builder().criteriaName("Đánh giá độ phức tạp hạ tầng và phân tán lỗi").maxScore(3.5).description("Mạng trễ, Circuit breaker, Event-driven").build());
        questionRepository.save(q4);

        // Câu 5: DRAFT (Câu hỏi do AI sinh ra - chờ giảng viên duyệt)
        Question q5 = Question.builder()
                .subject(swe201)
                .content("[AI Draft] Trình bày vòng đời của một HTTP Request từ trình duyệt đến Controller trong kiến trúc MVC?")
                .sampleAnswer("Client gửi request -> Web Server -> DispatcherServlet -> HandlerMapping tìm Controller -> Controller xử lý và trả về Model/View hoặc JSON response.")
                .bloomLevel(BloomLevel.UNDERSTAND)
                .isAiGenerated(true)
                .status(QuestionStatus.DRAFT)
                .build();
        q5.addRubric(QuestionRubric.builder().criteriaName("Mô tả đúng vai trò của DispatcherServlet").maxScore(5.0).description("Điều phối trung tâm của mô hình MVC").build());
        q5.addRubric(QuestionRubric.builder().criteriaName("Giải thích tầng Controller, Service và JSON serialization").maxScore(5.0).description("Luồng dữ liệu hoàn chỉnh").build());
        questionRepository.save(q5);

        // 4. Tạo Kỳ thi mẫu
        Exam exam = examRepository.save(Exam.builder()
                .subject(swe201)
                .title("Kỳ thi Vấn đáp Cuối kỳ SWE201 - Học kỳ Fall 2026")
                .durationPerStudentMins(15)
                .maxMainQuestions(3)
                .maxFollowupQuestions(2)
                .build());

        // 5. Tạo các Ca thi mẫu
        // Ca 1: Đã thi xong, Giảng viên đã chốt điểm (Minh họa Human-in-the-loop)
        examSessionRepository.save(ExamSession.builder()
                .exam(exam)
                .student(student1)
                .scheduledStartTime(LocalDateTime.now().minusHours(2))
                .status(ExamSessionStatus.COMPLETED)
                .aiSuggestedScore(8.5)
                .finalTeacherScore(9.0)
                .teacherFeedback("Sinh viên trả lời lưu loát, nắm chắc bản chất OOP và giải thích rất tốt phần IoC/DI.")
                .build());

        // Ca 2: Đang chờ giảng viên duyệt điểm
        examSessionRepository.save(ExamSession.builder()
                .exam(exam)
                .student(student2)
                .scheduledStartTime(LocalDateTime.now().minusHours(1))
                .status(ExamSessionStatus.IN_PROGRESS)
                .aiSuggestedScore(7.5)
                .finalTeacherScore(null)
                .teacherFeedback(null)
                .build());

        // Ca 3: Lịch thi sắp tới
        examSessionRepository.save(ExamSession.builder()
                .exam(exam)
                .student(student3)
                .scheduledStartTime(LocalDateTime.now().plusHours(2))
                .status(ExamSessionStatus.SCHEDULED)
                .build());

        log.info("Nạp dữ liệu mẫu hoàn tất! Hệ thống đã sẵn sàng cho buổi demo.");
    }
}
