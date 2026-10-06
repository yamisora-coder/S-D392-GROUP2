package com.group2.aives.application.port.in;

import com.group2.aives.application.dto.request.GradeSubmissionRequest;
import com.group2.aives.application.dto.request.SessionRequest;
import com.group2.aives.application.dto.response.SessionResponse;

import java.util.List;

public interface SessionService {
    List<SessionResponse> getSessionsByExamId(Long examId);
    List<SessionResponse> getAllSessions();
    SessionResponse createSession(SessionRequest request);
    SessionResponse finalizeGrade(Long sessionId, GradeSubmissionRequest request);
    void deleteSession(Long sessionId);
}
