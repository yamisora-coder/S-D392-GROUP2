package com.group2.aives.application.service;

import com.group2.aives.application.dto.request.ExamRequest;
import com.group2.aives.application.dto.response.ExamResponse;

import java.util.List;
import java.util.UUID;

public interface ExamService {
    List<ExamResponse> getAllExams();
    ExamResponse getExamById(UUID id);
    ExamResponse createExam(ExamRequest request);
    ExamResponse updateExam(UUID id, ExamRequest request);
    void deleteExam(UUID id);
}
