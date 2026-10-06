package com.group2.aives.infrastructure.config;

import com.group2.aives.domain.model.Course;
import com.group2.aives.domain.model.Exam;
import com.group2.aives.domain.model.ExamQuestion;
import com.group2.aives.domain.model.ExamQuestionId;
import com.group2.aives.domain.model.ExamSession;
import com.group2.aives.domain.model.FinalGrade;
import com.group2.aives.domain.model.Question;
import com.group2.aives.domain.model.Role;
import com.group2.aives.domain.model.Rubric;
import com.group2.aives.domain.model.RubricCriterion;
import com.group2.aives.domain.model.User;
import com.group2.aives.domain.enums.BloomLevel;
import com.group2.aives.domain.enums.QuestionSource;
import com.group2.aives.domain.enums.QuestionStatus;
import com.group2.aives.domain.enums.RoleEnum;
import com.group2.aives.application.port.out.CourseRepository;
import com.group2.aives.application.port.out.ExamQuestionRepository;
import com.group2.aives.application.port.out.ExamRepository;
import com.group2.aives.application.port.out.ExamSessionRepository;
import com.group2.aives.application.port.out.FinalGradeRepository;
import com.group2.aives.application.port.out.QuestionRepository;
import com.group2.aives.application.port.out.RoleRepository;
import com.group2.aives.application.port.out.RubricRepository;
import com.group2.aives.application.port.out.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CourseRepository courseRepository;
    private final RubricRepository rubricRepository;
    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final ExamSessionRepository examSessionRepository;
    private final FinalGradeRepository finalGradeRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (courseRepository.count() > 0) {
            log.info("Dữ liệu đã tồn tại trong CSDL aives_db. Cập nhật mật khẩu chuẩn BCrypt cho các tài khoản test...");
            userRepository.findAll().forEach(u -> {
                if (!passwordEncoder.matches("123456", u.getPasswordHash())) {
                    u.setPasswordHash(passwordEncoder.encode("123456"));
                    userRepository.save(u);
                }
            });
            return;
        }

        log.info("Bắt đầu nạp dữ liệu mẫu cho hệ thống AIVES theo chuẩn 18 bảng...");

        // 1. Lấy Roles chuẩn
        Role adminRole = roleRepository.findByRoleName(RoleEnum.ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().roleName(RoleEnum.ADMIN).build()));
        Role lecturerRole = roleRepository.findByRoleName(RoleEnum.LECTURER)
                .orElseGet(() -> roleRepository.save(Role.builder().roleName(RoleEnum.LECTURER).build()));
        Role studentRole = roleRepository.findByRoleName(RoleEnum.STUDENT)
                .orElseGet(() -> roleRepository.save(Role.builder().roleName(RoleEnum.STUDENT).build()));

        // 2. Tạo Users mẫu
        User admin = userRepository.save(User.builder()
                .email("admin@aives.edu.vn")
                .passwordHash("$2a$10$e8Z4J8qB7rN6r5Wf2o8M2.YF3k6.b0u8A1s8q9v0w1x2y3z4a5b6c")
                .fullName("Quản trị viên Hệ thống")
                .roles(Set.of(adminRole))
                .build());

        User lecturer = userRepository.save(User.builder()
                .email("gv.nguyen@fpt.edu.vn")
                .passwordHash("$2a$10$e8Z4J8qB7rN6r5Wf2o8M2.YF3k6.b0u8A1s8q9v0w1x2y3z4a5b6c")
                .fullName("ThS. Nguyễn Văn Giảng")
                .roles(Set.of(lecturerRole))
                .build());

        User student1 = userRepository.save(User.builder()
                .email("an.tv.se170001@fpt.edu.vn")
                .passwordHash("$2a$10$e8Z4J8qB7rN6r5Wf2o8M2.YF3k6.b0u8A1s8q9v0w1x2y3z4a5b6c")
                .fullName("Trần Văn An")
                .roles(Set.of(studentRole))
                .build());

        User student2 = userRepository.save(User.builder()
                .email("binh.lt.se170002@fpt.edu.vn")
                .passwordHash("$2a$10$e8Z4J8qB7rN6r5Wf2o8M2.YF3k6.b0u8A1s8q9v0w1x2y3z4a5b6c")
                .fullName("Lê Thị Bình")
                .roles(Set.of(studentRole))
                .build());

        User student3 = userRepository.save(User.builder()
                .email("cuong.pm.se170003@fpt.edu.vn")
                .passwordHash("$2a$10$e8Z4J8qB7rN6r5Wf2o8M2.YF3k6.b0u8A1s8q9v0w1x2y3z4a5b6c")
                .fullName("Phạm Minh Cường")
                .roles(Set.of(studentRole))
                .build());

        // 3. Tạo Môn học mẫu
        Course swe201 = courseRepository.save(Course.builder()
                .courseCode("SWE201")
                .courseName("Kỹ thuật Phần mềm (Software Engineering)")
                .managedBy(lecturer)
                .build());

        Course prn231 = courseRepository.save(Course.builder()
                .courseCode("PRN231")
                .courseName("Xây dựng Web API & Lập trình Phân tán")
                .managedBy(lecturer)
                .build());

        // 4. Tạo Barem Rubric mẫu
        Rubric rubricOop = Rubric.builder()
                .name("Rubric Khảo thí Lập trình Hướng đối tượng")
                .description("Đánh giá độ hiểu biết bản chất 4 tính chất OOP và ví dụ thực tiễn")
                .criteria(new ArrayList<>())
                .build();
        rubricOop.addCriterion(RubricCriterion.builder().criterionName("Nêu đúng định nghĩa OOP").maxScore(new BigDecimal("2.00")).expectedAnswerKeywords("đối tượng, lớp, trạng thái, hành vi").build());
        rubricOop.addCriterion(RubricCriterion.builder().criterionName("Liệt kê đầy đủ 4 tính chất").maxScore(new BigDecimal("4.00")).expectedAnswerKeywords("encapsulation, inheritance, polymorphism, abstraction").build());
        rubricOop.addCriterion(RubricCriterion.builder().criterionName("Giải thích ngắn gọn ý nghĩa từng tính chất").maxScore(new BigDecimal("4.00")).expectedAnswerKeywords("che giấu thông tin, tái sử dụng, đa hình, trừu tượng").build());
        Rubric savedRubricOop = rubricRepository.save(rubricOop);

        Rubric rubricDi = Rubric.builder()
                .name("Rubric Khảo thí Inversion of Control & DI")
                .description("Đánh giá năng lực thiết kế phần mềm linh hoạt bằng DI")
                .criteria(new ArrayList<>())
                .build();
        rubricDi.addCriterion(RubricCriterion.builder().criterionName("Phân biệt rõ IoC Container và DI").maxScore(new BigDecimal("4.00")).expectedAnswerKeywords("IoC, Dependency Injection, bean container").build());
        rubricDi.addCriterion(RubricCriterion.builder().criterionName("Trình bày được 3 kiểu DI trong Spring").maxScore(new BigDecimal("6.00")).expectedAnswerKeywords("Constructor injection, Setter injection, Field injection").build());
        Rubric savedRubricDi = rubricRepository.save(rubricDi);

        // 5. Tạo Câu hỏi mẫu
        Question q1 = questionRepository.save(Question.builder()
                .course(swe201)
                .rubric(savedRubricOop)
                .questionText("Nêu định nghĩa và 4 tính chất cơ bản của lập trình hướng đối tượng (OOP)?")
                .sampleAnswer("OOP là phương pháp lập trình dựa trên đối tượng và lớp. 4 tính chất: Đóng gói, Kế thừa, Đa hình, Trừu tượng.")
                .bloomLevel(BloomLevel.REMEMBER)
                .difficulty((short) 1)
                .sourceType(QuestionSource.MANUAL)
                .status(QuestionStatus.APPROVED)
                .reviewedBy(lecturer)
                .reviewedAt(LocalDateTime.now())
                .build());

        Question q2 = questionRepository.save(Question.builder()
                .course(swe201)
                .rubric(savedRubricDi)
                .questionText("Giải thích cơ chế hoạt động của Inversion of Control (IoC) và Dependency Injection (DI)?")
                .sampleAnswer("IoC đảo ngược quyền điều khiển việc tạo object cho framework. DI là kỹ thuật cung cấp dependencies cho một class từ bên ngoài.")
                .bloomLevel(BloomLevel.UNDERSTAND)
                .difficulty((short) 2)
                .sourceType(QuestionSource.MANUAL)
                .status(QuestionStatus.APPROVED)
                .reviewedBy(lecturer)
                .reviewedAt(LocalDateTime.now())
                .build());

        // 6. Tạo Kỳ thi & Gán câu hỏi
        Exam exam = examRepository.save(Exam.builder()
                .course(swe201)
                .title("Kỳ thi Vấn đáp Cuối kỳ - SWE201")
                .durationMinutes(15)
                .maxFollowUpPerQ(2)
                .build());

        examQuestionRepository.save(ExamQuestion.builder()
                .id(new ExamQuestionId(exam.getExamId(), q1.getQuestionId()))
                .exam(exam)
                .question(q1)
                .questionOrder(1)
                .build());

        examQuestionRepository.save(ExamQuestion.builder()
                .id(new ExamQuestionId(exam.getExamId(), q2.getQuestionId()))
                .exam(exam)
                .question(q2)
                .questionOrder(2)
                .build());

        // 7. Tạo Ca thi & Chốt điểm mẫu
        ExamSession session1 = examSessionRepository.save(ExamSession.builder()
                .exam(exam)
                .student(student1)
                .startedAt(LocalDateTime.now().minusHours(2))
                .endedAt(LocalDateTime.now().minusHours(1))
                .status("COMPLETED")
                .build());

        finalGradeRepository.save(FinalGrade.builder()
                .session(session1)
                .confirmedBy(lecturer)
                .finalScore(new BigDecimal("8.50"))
                .lecturerFeedback("Thí sinh nắm rất chắc 4 tính chất OOP, trả lời lưu loát câu hỏi chính.")
                .build());

        examSessionRepository.save(ExamSession.builder()
                .exam(exam)
                .student(student2)
                .startedAt(LocalDateTime.now().minusMinutes(30))
                .status("ONGOING")
                .build());

        examSessionRepository.save(ExamSession.builder()
                .exam(exam)
                .student(student3)
                .startedAt(LocalDateTime.now().plusHours(1))
                .status("SCHEDULED")
                .build());

        log.info("Nạp dữ liệu mẫu hoàn tất! Hệ thống AIVES 18 bảng đã sẵn sàng.");
    }
}
