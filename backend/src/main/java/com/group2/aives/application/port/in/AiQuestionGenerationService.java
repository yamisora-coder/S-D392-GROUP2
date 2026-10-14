package com.group2.aives.application.port.in;

import com.group2.aives.application.dto.request.GenerateQuestionsRequest;
import com.group2.aives.application.dto.response.QuestionGenerationRequestResponse;

import java.util.List;

public interface AiQuestionGenerationService {
    QuestionGenerationRequestResponse generateQuestions(GenerateQuestionsRequest request, Long requestedByUserId);
    List<QuestionGenerationRequestResponse> getGenerationRequests(Long courseId, Long userId);
    QuestionGenerationRequestResponse getGenerationRequestById(Long requestId);
}
