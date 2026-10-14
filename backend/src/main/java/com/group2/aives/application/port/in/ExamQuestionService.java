package com.group2.aives.application.port.in;

import com.group2.aives.application.dto.request.ExamQuestionRequest;
import com.group2.aives.application.dto.response.ExamQuestionResponse;

import java.util.List;

public interface ExamQuestionService {
    List<ExamQuestionResponse> getQuestionsByExam(Long examId);
    ExamQuestionResponse addQuestionToExam(Long examId, ExamQuestionRequest request);
    ExamQuestionResponse updateQuestionOrder(Long examId, Long questionId, Integer newOrder);
    void removeQuestionFromExam(Long examId, Long questionId);
}
