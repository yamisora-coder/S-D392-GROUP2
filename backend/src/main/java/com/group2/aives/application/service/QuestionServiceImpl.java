package com.group2.aives.application.service;

import com.group2.aives.application.dto.request.QuestionRequest;
import com.group2.aives.application.dto.response.QuestionResponse;
import com.group2.aives.domain.model.Course;
import com.group2.aives.domain.model.Question;
import com.group2.aives.domain.model.Rubric;
import com.group2.aives.domain.model.User;
import com.group2.aives.domain.enums.BloomLevel;
import com.group2.aives.domain.enums.QuestionSource;
import com.group2.aives.domain.enums.QuestionStatus;
import com.group2.aives.application.port.out.CourseRepository;
import com.group2.aives.application.port.out.QuestionRepository;
import com.group2.aives.application.port.out.RubricRepository;
import com.group2.aives.application.port.out.UserRepository;
import com.group2.aives.application.port.in.QuestionService;
import com.group2.aives.domain.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final CourseRepository courseRepository;
    private final RubricRepository rubricRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestions(Long courseId, BloomLevel bloomLevel, QuestionStatus status) {
        org.springframework.data.jpa.domain.Specification<Question> spec = (root, query, cb) -> cb.conjunction();

        if (courseId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("course").get("courseId"), courseId));
        }
        if (bloomLevel != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("bloomLevel"), bloomLevel));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        return questionRepository.findAll(spec, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public QuestionResponse getQuestionById(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy câu hỏi với ID: " + id));
        return mapToResponse(question);
    }

    @Override
    @Transactional
    public QuestionResponse createQuestion(QuestionRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học với ID: " + request.getCourseId()));

        Rubric rubric = rubricRepository.findById(request.getRubricId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bộ Rubric với ID: " + request.getRubricId()));

        User reviewedBy = null;
        LocalDateTime reviewedAt = null;
        if (request.getReviewedById() != null) {
            reviewedBy = userRepository.findById(request.getReviewedById()).orElse(null);
            reviewedAt = LocalDateTime.now();
        }

        Question question = Question.builder()
                .course(course)
                .rubric(rubric)
                .questionText(request.getQuestionText().trim())
                .sampleAnswer(request.getSampleAnswer())
                .bloomLevel(request.getBloomLevel())
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : (short) 1)
                .sourceType(request.getSourceType() != null ? request.getSourceType() : QuestionSource.MANUAL)
                .status(request.getStatus() != null ? request.getStatus() : QuestionStatus.DRAFT)
                .reviewedBy(reviewedBy)
                .reviewedAt(reviewedAt)
                .build();

        Question saved = questionRepository.save(question);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public QuestionResponse updateQuestion(Long id, QuestionRequest request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy câu hỏi với ID: " + id));

        if (!question.getCourse().getCourseId().equals(request.getCourseId())) {
            Course newCourse = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học với ID: " + request.getCourseId()));
            question.setCourse(newCourse);
        }

        if (!question.getRubric().getRubricId().equals(request.getRubricId())) {
            Rubric newRubric = rubricRepository.findById(request.getRubricId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bộ Rubric với ID: " + request.getRubricId()));
            question.setRubric(newRubric);
        }

        question.setQuestionText(request.getQuestionText().trim());
        question.setSampleAnswer(request.getSampleAnswer());
        question.setBloomLevel(request.getBloomLevel());
        if (request.getDifficulty() != null) {
            question.setDifficulty(request.getDifficulty());
        }
        if (request.getSourceType() != null) {
            question.setSourceType(request.getSourceType());
        }
        if (request.getStatus() != null) {
            question.setStatus(request.getStatus());
        }

        if (request.getReviewedById() != null) {
            User reviewer = userRepository.findById(request.getReviewedById()).orElse(null);
            question.setReviewedBy(reviewer);
            question.setReviewedAt(LocalDateTime.now());
        }

        Question updated = questionRepository.save(question);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteQuestion(Long id) {
        if (!questionRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy câu hỏi với ID: " + id);
        }
        questionRepository.deleteById(id);
    }

    @Override
    @Transactional
    public QuestionResponse updateStatus(Long id, QuestionStatus status) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy câu hỏi với ID: " + id));
        question.setStatus(status);
        return mapToResponse(questionRepository.save(question));
    }

    @Override
    @Transactional
    public List<QuestionResponse> importFromCsv(MultipartFile file, Long courseId, Long rubricId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học ID: " + courseId));
        Rubric rubric = rubricRepository.findById(rubricId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Rubric ID: " + rubricId));

        List<QuestionResponse> imported = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String header = reader.readLine(); // bỏ dòng tiêu đề
            if (header == null) throw new BadRequestException("File CSV trống");

            String line;
            int lineNum = 1;
            while ((line = reader.readLine()) != null) {
                lineNum++;
                if (line.isBlank()) continue;

                // Định dạng CSV: question_text,sample_answer,bloom_level,difficulty
                String[] parts = parseCsvLine(line);
                if (parts.length < 1 || parts[0].isBlank()) {
                    log.warn("Bỏ qua dòng {} rỗng", lineNum);
                    continue;
                }

                BloomLevel bloom = BloomLevel.REMEMBER;
                if (parts.length >= 3 && !parts[2].isBlank()) {
                    try { bloom = BloomLevel.valueOf(parts[2].trim().toUpperCase()); }
                    catch (IllegalArgumentException e) { log.warn("Mức Bloom không hợp lệ tại dòng {}: {}", lineNum, parts[2]); }
                }

                short difficulty = 1;
                if (parts.length >= 4 && !parts[3].isBlank()) {
                    try { difficulty = Short.parseShort(parts[3].trim()); }
                    catch (NumberFormatException e) { log.warn("Độ khó không hợp lệ tại dòng {}: {}", lineNum, parts[3]); }
                }

                Question question = Question.builder()
                        .course(course)
                        .rubric(rubric)
                        .questionText(parts[0].trim())
                        .sampleAnswer(parts.length >= 2 ? parts[1].trim() : null)
                        .bloomLevel(bloom)
                        .difficulty(difficulty)
                        .sourceType(QuestionSource.IMPORTED)
                        .status(QuestionStatus.PENDING_REVIEW)
                        .build();

                imported.add(mapToResponse(questionRepository.save(question)));
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi đọc file CSV: " + e.getMessage(), e);
        }

        log.info("Import CSV hoàn tất: {} câu hỏi từ file {}", imported.size(), file.getOriginalFilename());
        return imported;
    }

    // Tách dòng CSV đơn giản (hỗ trợ trường bao bởi dấu ngoặc kép)
    private String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                fields.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        fields.add(sb.toString());
        return fields.toArray(new String[0]);
    }

    private QuestionResponse mapToResponse(Question question) {
        return QuestionResponse.builder()
                .id(question.getQuestionId())
                .courseId(question.getCourse() != null ? question.getCourse().getCourseId() : null)
                .courseCode(question.getCourse() != null ? question.getCourse().getCourseCode() : null)
                .courseName(question.getCourse() != null ? question.getCourse().getCourseName() : null)
                .rubricId(question.getRubric() != null ? question.getRubric().getRubricId() : null)
                .rubricName(question.getRubric() != null ? question.getRubric().getName() : null)
                .questionText(question.getQuestionText())
                .sampleAnswer(question.getSampleAnswer())
                .bloomLevel(question.getBloomLevel())
                .difficulty(question.getDifficulty())
                .sourceType(question.getSourceType())
                .status(question.getStatus())
                .reviewedById(question.getReviewedBy() != null ? question.getReviewedBy().getUserId() : null)
                .reviewedByName(question.getReviewedBy() != null ? question.getReviewedBy().getFullName() : null)
                .reviewedAt(question.getReviewedAt())
                .createdAt(question.getCreatedAt())
                .build();
    }
}
