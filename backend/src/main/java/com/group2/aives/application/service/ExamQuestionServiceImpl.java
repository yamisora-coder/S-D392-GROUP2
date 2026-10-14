package com.group2.aives.application.service;

import com.group2.aives.application.dto.request.ExamQuestionRequest;
import com.group2.aives.application.dto.response.ExamQuestionResponse;
import com.group2.aives.application.port.in.ExamQuestionService;
import com.group2.aives.application.port.out.ExamQuestionRepository;
import com.group2.aives.application.port.out.ExamRepository;
import com.group2.aives.application.port.out.QuestionRepository;
import com.group2.aives.domain.exception.BadRequestException;
import com.group2.aives.domain.exception.ResourceNotFoundException;
import com.group2.aives.domain.model.Exam;
import com.group2.aives.domain.model.ExamQuestion;
import com.group2.aives.domain.model.ExamQuestionId;
import com.group2.aives.domain.model.Question;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamQuestionServiceImpl implements ExamQuestionService {

    private final ExamQuestionRepository examQuestionRepository;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ExamQuestionResponse> getQuestionsByExam(Long examId) {
        return examQuestionRepository.findByExam_ExamIdOrderByQuestionOrderAsc(examId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ExamQuestionResponse addQuestionToExam(Long examId, ExamQuestionRequest request) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ thi ID: " + examId));
        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi ID: " + request.getQuestionId()));

        ExamQuestionId id = new ExamQuestionId(examId, request.getQuestionId());
        if (examQuestionRepository.existsById(id)) {
            throw new BadRequestException("Câu hỏi này đã có trong kỳ thi.");
        }

        ExamQuestion eq = ExamQuestion.builder()
                .id(id)
                .exam(exam)
                .question(question)
                .questionOrder(request.getQuestionOrder())
                .build();

        return mapToResponse(examQuestionRepository.save(eq));
    }

    @Override
    @Transactional
    public ExamQuestionResponse updateQuestionOrder(Long examId, Long questionId, Integer newOrder) {
        ExamQuestionId id = new ExamQuestionId(examId, questionId);
        ExamQuestion eq = examQuestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Câu hỏi không có trong kỳ thi này."));
        eq.setQuestionOrder(newOrder);
        return mapToResponse(examQuestionRepository.save(eq));
    }

    @Override
    @Transactional
    public void removeQuestionFromExam(Long examId, Long questionId) {
        ExamQuestionId id = new ExamQuestionId(examId, questionId);
        if (!examQuestionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Câu hỏi không có trong kỳ thi này.");
        }
        examQuestionRepository.deleteById(id);
    }

    private ExamQuestionResponse mapToResponse(ExamQuestion eq) {
        Question q = eq.getQuestion();
        return ExamQuestionResponse.builder()
                .examId(eq.getExam() != null ? eq.getExam().getExamId() : null)
                .examTitle(eq.getExam() != null ? eq.getExam().getTitle() : null)
                .questionId(q != null ? q.getQuestionId() : null)
                .questionText(q != null ? q.getQuestionText() : null)
                .sampleAnswer(q != null ? q.getSampleAnswer() : null)
                .bloomLevel(q != null ? q.getBloomLevel() : null)
                .difficulty(q != null ? q.getDifficulty() : null)
                .rubricId(q != null && q.getRubric() != null ? q.getRubric().getRubricId() : null)
                .rubricName(q != null && q.getRubric() != null ? q.getRubric().getName() : null)
                .questionOrder(eq.getQuestionOrder())
                .build();
    }
}
