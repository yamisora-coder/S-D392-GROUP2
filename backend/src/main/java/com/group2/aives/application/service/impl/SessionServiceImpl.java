package com.group2.aives.application.service.impl;

import com.group2.aives.application.dto.request.GradeSubmissionRequest;
import com.group2.aives.application.dto.request.SessionRequest;
import com.group2.aives.application.dto.response.SessionResponse;
import com.group2.aives.domain.model.Exam;
import com.group2.aives.domain.model.ExamSession;
import com.group2.aives.domain.model.User;
import com.group2.aives.domain.model.enums.ExamSessionStatus;
import com.group2.aives.domain.repository.ExamRepository;
import com.group2.aives.domain.repository.ExamSessionRepository;
import com.group2.aives.domain.repository.UserRepository;
import com.group2.aives.application.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final ExamSessionRepository sessionRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final com.group2.aives.infrastructure.persistence.jpa.AttemptJpaRepository attempts;
    private final com.group2.aives.infrastructure.persistence.jpa.AttemptRecordingJpaRepository recordings;

    @Override
    @Transactional(readOnly = true)
    public List<SessionResponse> getSessionsByExamId(UUID examId) {
        return sessionRepository.findByExamId(examId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SessionResponse> getAllSessions() {
        return sessionRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SessionResponse> getSessionsByStudentId(UUID studentId) {
        return sessionRepository.findByStudentId(studentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SessionResponse createSession(SessionRequest request) {
        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ thi"));
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên"));

        ExamSession session = ExamSession.builder()
                .exam(exam)
                .student(student)
                .scheduledStartTime(request.getScheduledStartTime())
                .status(ExamSessionStatus.SCHEDULED)
                .build();

        ExamSession saved = sessionRepository.save(session);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public SessionResponse finalizeGrade(UUID sessionId, GradeSubmissionRequest request) {
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ca thi"));

        var attempt=attempts.findById(sessionId).orElseThrow(() -> new IllegalArgumentException("Chưa có bài thi để chấm"));
        if(attempt.getSubmittedAt()==null)throw new IllegalArgumentException("Thí sinh chưa nộp bài");
        session.setFinalTeacherScore(request.getFinalTeacherScore());
        session.setTeacherFeedback(request.getTeacherFeedback());
        session.setStatus(ExamSessionStatus.COMPLETED);

        ExamSession updated = sessionRepository.save(session);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteSession(UUID sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new RuntimeException("Không tìm thấy ca thi");
        }
        recordings.removeSession(sessionId);attempts.findById(sessionId).ifPresent(attempts::delete);
        sessionRepository.deleteById(sessionId);
    }

    private SessionResponse mapToResponse(ExamSession session) {
        return SessionResponse.builder()
                .id(session.getId())
                .hasAttempt(attempts.existsById(session.getId()))
                .submittedAt(attempts.findById(session.getId()).map(a -> a.getSubmittedAt()).orElse(null))
                .examId(session.getExam().getId())
                .examTitle(session.getExam().getTitle())
                .subjectName(session.getExam().getSubject().getName())
                .studentId(session.getStudent().getId())
                .studentName(session.getStudent().getFullName())
                .studentCode(session.getStudent().getCode())
                .studentEmail(session.getStudent().getEmail())
                .scheduledStartTime(session.getScheduledStartTime())
                .status(session.getStatus())
                .aiSuggestedScore(session.getAiSuggestedScore())
                .finalTeacherScore(session.getFinalTeacherScore())
                .teacherFeedback(session.getTeacherFeedback())
                .build();
    }
}
