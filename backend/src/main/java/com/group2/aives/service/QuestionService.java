package com.group2.aives.service;

import com.group2.aives.dto.request.QuestionRequest;
import com.group2.aives.dto.response.QuestionResponse;
import com.group2.aives.entity.enums.BloomLevel;
import com.group2.aives.entity.enums.QuestionStatus;

import java.util.List;
import java.util.UUID;

public interface QuestionService {
    List<QuestionResponse> getQuestions(UUID subjectId, BloomLevel bloomLevel, QuestionStatus status);
    QuestionResponse getQuestionById(UUID id);
    QuestionResponse createQuestion(QuestionRequest request);
    QuestionResponse updateQuestion(UUID id, QuestionRequest request);
    void deleteQuestion(UUID id);
    QuestionResponse updateStatus(UUID id, QuestionStatus status);
}
