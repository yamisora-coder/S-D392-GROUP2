package com.group2.aives.service.impl;

import com.group2.aives.dto.request.GradeSubmissionRequest;
import com.group2.aives.dto.request.SessionRequest;
import com.group2.aives.dto.response.SessionResponse;
import com.group2.aives.entity.Exam;
import com.group2.aives.entity.ExamSession;
import com.group2.aives.entity.User;
import com.group2.aives.entity.enums.ExamSessionStatus;
import com.group2.aives.repository.ExamRepository;
import com.group2.aives.repository.ExamSessionRepository;
import com.group2.aives.repository.UserRepository;
import com.group2.aives.service.SessionService;
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
        sessionRepository.deleteById(sessionId);
    }

    private SessionResponse mapToResponse(ExamSession session) {
        return SessionResponse.builder()
                .id(session.getId())
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
