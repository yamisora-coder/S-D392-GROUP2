package com.group2.aives.application.port.in;

import com.group2.aives.application.dto.request.QuestionRequest;
import com.group2.aives.application.dto.response.QuestionResponse;
import com.group2.aives.domain.enums.BloomLevel;
import com.group2.aives.domain.enums.QuestionStatus;

import java.util.List;

public interface QuestionService {
    List<QuestionResponse> getQuestions(Long courseId, BloomLevel bloomLevel, QuestionStatus status);
    QuestionResponse getQuestionById(Long id);
    QuestionResponse createQuestion(QuestionRequest request);
    QuestionResponse updateQuestion(Long id, QuestionRequest request);
    void deleteQuestion(Long id);
    QuestionResponse updateStatus(Long id, QuestionStatus status);
}
