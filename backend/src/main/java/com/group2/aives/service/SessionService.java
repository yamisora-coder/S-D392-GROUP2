package com.group2.aives.service;

import com.group2.aives.dto.request.GradeSubmissionRequest;
import com.group2.aives.dto.request.SessionRequest;
import com.group2.aives.dto.response.SessionResponse;

import java.util.List;
import java.util.UUID;

public interface SessionService {
    List<SessionResponse> getSessionsByExamId(UUID examId);
    List<SessionResponse> getAllSessions();
    SessionResponse createSession(SessionRequest request);
    SessionResponse finalizeGrade(UUID sessionId, GradeSubmissionRequest request);
    void deleteSession(UUID sessionId);
}
