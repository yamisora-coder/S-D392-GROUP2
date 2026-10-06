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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

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
