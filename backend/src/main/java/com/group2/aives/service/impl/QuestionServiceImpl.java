package com.group2.aives.service.impl;

import com.group2.aives.dto.request.QuestionRequest;
import com.group2.aives.dto.response.QuestionResponse;
import com.group2.aives.dto.response.RubricResponse;
import com.group2.aives.entity.Question;
import com.group2.aives.entity.QuestionRubric;
import com.group2.aives.entity.Subject;
import com.group2.aives.entity.User;
import com.group2.aives.entity.enums.BloomLevel;
import com.group2.aives.entity.enums.QuestionStatus;
import com.group2.aives.repository.QuestionRepository;
import com.group2.aives.repository.SubjectRepository;
import com.group2.aives.repository.UserRepository;
import com.group2.aives.service.QuestionService;
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
        question.setStatus(status);
        Question updated = questionRepository.save(question);
        return mapToResponse(updated);
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
