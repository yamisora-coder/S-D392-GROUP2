package com.group2.aives.application.service;

import com.group2.aives.application.dto.request.GradeSubmissionRequest;
import com.group2.aives.application.dto.request.SessionRequest;
import com.group2.aives.application.dto.response.SessionResponse;

import java.util.List;
import java.util.UUID;

public interface SessionService {
    List<SessionResponse> getSessionsByExamId(UUID examId);
    List<SessionResponse> getAllSessions();
    List<SessionResponse> getSessionsByStudentId(UUID studentId);
    SessionResponse createSession(SessionRequest request);
    SessionResponse finalizeGrade(UUID sessionId, GradeSubmissionRequest request);
    void deleteSession(UUID sessionId);
}
