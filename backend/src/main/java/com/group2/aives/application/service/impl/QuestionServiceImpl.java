package com.group2.aives.application.service.impl;

import com.group2.aives.application.dto.request.QuestionRequest;
import com.group2.aives.application.dto.response.QuestionResponse;
import com.group2.aives.application.dto.response.RubricResponse;
import com.group2.aives.domain.model.Question;
import com.group2.aives.domain.model.QuestionRubric;
import com.group2.aives.domain.model.Subject;
import com.group2.aives.domain.model.User;
import com.group2.aives.domain.model.enums.BloomLevel;
import com.group2.aives.domain.model.enums.QuestionStatus;
import com.group2.aives.domain.repository.QuestionRepository;
import com.group2.aives.domain.repository.SubjectRepository;
import com.group2.aives.domain.repository.UserRepository;
import com.group2.aives.application.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final com.group2.aives.infrastructure.persistence.jpa.ChapterJpaRepository chapters;

    @Override
    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestions(UUID subjectId, BloomLevel bloomLevel, QuestionStatus status) {
        return questionRepository.filterQuestions(subjectId, bloomLevel, status)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public QuestionResponse getQuestionById(UUID id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy câu hỏi với ID: " + id));
        return mapToResponse(question);
    }

    @Override
    @Transactional
    public QuestionResponse createQuestion(QuestionRequest request) {
        validateMetadata(request);
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học với ID: " + request.getSubjectId()));

        User createdBy = null;
        if (request.getCreatedById() != null) {
            createdBy = userRepository.findById(request.getCreatedById()).orElse(null);
        }

        Question question = Question.builder()
                .subject(subject)
                .content(request.getContent().trim())
                .sampleAnswer(request.getSampleAnswer())
                .chapterId(request.getChapterId()).difficulty(request.getDifficulty() == null ? com.group2.aives.domain.model.enums.Difficulty.MEDIUM : request.getDifficulty())
                .materialId(request.getMaterialId()).sourceReference(request.getSourceReference())
                .bloomLevel(request.getBloomLevel())
                .isAiGenerated(request.getIsAiGenerated() != null ? request.getIsAiGenerated() : false)
                .status(request.getStatus() != null ? request.getStatus() : QuestionStatus.DRAFT)
                .createdBy(createdBy)
                .rubrics(new ArrayList<>())
                .build();

        if (request.getRubrics() != null) {
            for (var r : request.getRubrics()) {
                QuestionRubric rubric = QuestionRubric.builder()
                        .criteriaName(r.getCriteriaName())
                        .maxScore(r.getMaxScore())
                        .description(r.getDescription())
                        .build();
                question.addRubric(rubric);
            }
        }

        if(question.getStatus() == QuestionStatus.APPROVED) validateApproval(question);
        Question saved = questionRepository.save(question);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public QuestionResponse updateQuestion(UUID id, QuestionRequest request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy câu hỏi với ID: " + id));

        if (!question.getSubject().getId().equals(request.getSubjectId())) {
            Subject newSubject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học"));
            question.setSubject(newSubject);
        }

        validateMetadata(request);
        question.setChapterId(request.getChapterId());
        question.setDifficulty(request.getDifficulty() == null ? com.group2.aives.domain.model.enums.Difficulty.MEDIUM : request.getDifficulty());
        question.setMaterialId(request.getMaterialId());question.setSourceReference(request.getSourceReference());
        question.setContent(request.getContent().trim());
        question.setSampleAnswer(request.getSampleAnswer());
        question.setBloomLevel(request.getBloomLevel());
        if (request.getStatus() != null) {
            question.setStatus(request.getStatus());
        }

        // Cập nhật lại danh sách rubrics
        question.getRubrics().clear();
        if (request.getRubrics() != null) {
            for (var r : request.getRubrics()) {
                QuestionRubric rubric = QuestionRubric.builder()
                        .criteriaName(r.getCriteriaName())
                        .maxScore(r.getMaxScore())
                        .description(r.getDescription())
                        .build();
                question.addRubric(rubric);
            }
        }

        if(question.getStatus() == QuestionStatus.APPROVED) validateApproval(question);
        Question updated = questionRepository.save(question);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteQuestion(UUID id) {
        if (!questionRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy câu hỏi với ID: " + id);
        }
        questionRepository.deleteById(id);
    }

    @Override
    @Transactional
    public QuestionResponse updateStatus(UUID id, QuestionStatus status) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy câu hỏi với ID: " + id));
        if (status == QuestionStatus.APPROVED) validateApproval(question);
        question.setStatus(status);
        if(question.getStatus() == QuestionStatus.APPROVED) validateApproval(question);
        Question updated = questionRepository.save(question);
        return mapToResponse(updated);
    }

    private void validateMetadata(QuestionRequest request) {
        if(request.getChapterId()!=null) {
            var chapter=chapters.findById(request.getChapterId()).orElseThrow(() -> new IllegalArgumentException("Chương không tồn tại"));
            if(!chapter.getSubjectId().equals(request.getSubjectId())) throw new IllegalArgumentException("Chương không thuộc môn học");
        }
    }
    private void validateApproval(Question question) {
        if(question.getRubrics()==null || question.getRubrics().isEmpty()) throw new IllegalArgumentException("Phải tạo rubric trước khi duyệt câu hỏi");
        double total=0;
        for(var r:question.getRubrics()) {
            if(r.getCriteriaName()==null || r.getCriteriaName().isBlank() || r.getDescription()==null || r.getDescription().isBlank() || r.getMaxScore()==null || !Double.isFinite(r.getMaxScore()) || r.getMaxScore()<=0)
                throw new IllegalArgumentException("Mỗi rubric cần tên, mô tả mức điểm và điểm tối đa dương");
            total+=r.getMaxScore();
        }
        if(Math.abs(total-10)>0.001) throw new IllegalArgumentException("Tổng điểm rubric phải bằng 10");
    }
    private QuestionResponse mapToResponse(Question question) {
        List<RubricResponse> rubricResponses = question.getRubrics() != null
                ? question.getRubrics().stream()
                    .map(r -> RubricResponse.builder()
                            .id(r.getId())
                            .criteriaName(r.getCriteriaName())
                            .maxScore(r.getMaxScore())
                            .description(r.getDescription())
                            .build())
                    .collect(Collectors.toList())
                : new ArrayList<>();

        double totalScore = rubricResponses.stream()
                .mapToDouble(RubricResponse::getMaxScore)
                .sum();

        return QuestionResponse.builder()
                .id(question.getId())
                .subjectId(question.getSubject().getId())
                .subjectCode(question.getSubject().getCode())
                .subjectName(question.getSubject().getName())
                .content(question.getContent())
                .sampleAnswer(question.getSampleAnswer())
                .chapterId(question.getChapterId()).difficulty(question.getDifficulty())
                .materialId(question.getMaterialId()).sourceReference(question.getSourceReference())
                .bloomLevel(question.getBloomLevel())
                .isAiGenerated(question.getIsAiGenerated())
                .status(question.getStatus())
                .createdByName(question.getCreatedBy() != null ? question.getCreatedBy().getFullName() : "Hệ thống AI")
                .rubrics(rubricResponses)
                .totalRubricScore(totalScore)
                .createdAt(question.getCreatedAt())
                .build();
    }
}
