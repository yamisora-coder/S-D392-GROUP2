package com.group2.aives.application.port.in;

import com.group2.aives.application.dto.request.ExamRequest;
import com.group2.aives.application.dto.response.ExamResponse;

import java.util.List;

public interface ExamService {
    List<ExamResponse> getAllExams();
    ExamResponse getExamById(Long id);
    ExamResponse createExam(ExamRequest request);
    ExamResponse updateExam(Long id, ExamRequest request);
    void deleteExam(Long id);
}
