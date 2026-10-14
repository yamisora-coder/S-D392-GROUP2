package com.group2.aives.application.service;

import com.group2.aives.application.dto.request.GradeSubmissionRequest;
import com.group2.aives.application.dto.request.SessionRequest;
import com.group2.aives.application.dto.response.SessionResponse;
import com.group2.aives.domain.model.Exam;
import com.group2.aives.domain.model.ExamSession;
import com.group2.aives.domain.model.FinalGrade;
import com.group2.aives.domain.model.SessionTurn;
import com.group2.aives.domain.model.Transcript;
import com.group2.aives.domain.model.User;
import com.group2.aives.application.port.out.ExamRepository;
import com.group2.aives.application.port.out.ExamSessionRepository;
import com.group2.aives.application.port.out.FinalGradeRepository;
import com.group2.aives.application.port.out.SessionTurnRepository;
import com.group2.aives.application.port.out.TranscriptRepository;
import com.group2.aives.application.port.out.UserRepository;
import com.group2.aives.application.port.in.SessionService;
import com.group2.aives.domain.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final ExamSessionRepository sessionRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final FinalGradeRepository finalGradeRepository;
    private final SessionTurnRepository sessionTurnRepository;
    private final TranscriptRepository transcriptRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SessionResponse> getSessionsByExamId(Long examId) {
        return sessionRepository.findByExam_ExamId(examId).stream()
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ thi với ID: " + request.getExamId()));
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên với ID: " + request.getStudentId()));

        ExamSession session = ExamSession.builder()
                .exam(exam)
                .student(student)
                .startedAt(request.getScheduledStartTime() != null ? request.getScheduledStartTime() : LocalDateTime.now())
                .status("ONGOING")
                .build();

        ExamSession saved = sessionRepository.save(session);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public SessionResponse finalizeGrade(Long sessionId, GradeSubmissionRequest request) {
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ca thi với ID: " + sessionId));

        User confirmedBy;
        if (request.getConfirmedById() != null) {
            confirmedBy = userRepository.findById(request.getConfirmedById()).orElse(session.getExam().getCourse().getManagedBy());
        } else {
            confirmedBy = session.getExam().getCourse().getManagedBy();
        }

        FinalGrade finalGrade = finalGradeRepository.findBySession_SessionId(sessionId)
                .orElse(FinalGrade.builder().session(session).build());

        finalGrade.setConfirmedBy(confirmedBy);
        finalGrade.setFinalScore(request.getFinalScore());
        finalGrade.setLecturerFeedback(request.getFeedback());
        finalGradeRepository.save(finalGrade);

        session.setFinalGrade(finalGrade);
        session.setStatus("COMPLETED");
        session.setEndedAt(LocalDateTime.now());

        ExamSession updated = sessionRepository.save(session);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteSession(Long sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new RuntimeException("Không tìm thấy ca thi với ID: " + sessionId);
        }
        sessionRepository.deleteById(sessionId);
    }

    @Override
    @Transactional(readOnly = true)
    public String exportTranscriptCsv(Long sessionId) {
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca thi ID: " + sessionId));

        List<SessionTurn> turns = sessionTurnRepository.findBySession_SessionIdOrderBySequenceNumberAsc(sessionId);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        StringBuilder csv = new StringBuilder();
        csv.append("STT,Loai_luot,Cau_hoi,Cau_tra_loi,Thoi_gian_tra_loi_giay,Thoi_diem\n");

        for (SessionTurn turn : turns) {
            Transcript tr = transcriptRepository.findByTurn_TurnId(turn.getTurnId()).orElse(null);
            String answer   = tr != null ? tr.getSttText().replace("\"", "\"\"") : "";
            String duration = tr != null && tr.getAnswerDurationSeconds() != null
                    ? String.valueOf(tr.getAnswerDurationSeconds()) : "";
            String time     = turn.getCreatedAt() != null ? turn.getCreatedAt().format(fmt) : "";
            String question = turn.getQuestionText().replace("\"", "\"\"");

            csv.append(turn.getSequenceNumber()).append(",")
               .append(turn.getTurnType().name()).append(",")
               .append("\"").append(question).append("\",")
               .append("\"").append(answer).append("\",")
               .append(duration).append(",")
               .append(time).append("\n");
        }

        String studentName = session.getStudent() != null ? session.getStudent().getFullName() : "unknown";
        String examTitle   = session.getExam() != null ? session.getExam().getTitle() : "unknown";
        String header = "# Ca thi: " + examTitle + " | Sinh vien: " + studentName
                + " | Bat dau: " + (session.getStartedAt() != null ? session.getStartedAt().format(fmt) : "") + "\n";

        return header + csv;
    }

    private SessionResponse mapToResponse(ExamSession session) {
        FinalGrade fg = session.getFinalGrade();
        if (fg == null) {
            fg = finalGradeRepository.findBySession_SessionId(session.getSessionId()).orElse(null);
        }

        return SessionResponse.builder()
                .id(session.getSessionId())
                .examId(session.getExam() != null ? session.getExam().getExamId() : null)
                .examTitle(session.getExam() != null ? session.getExam().getTitle() : null)
                .courseCode(session.getExam() != null && session.getExam().getCourse() != null ? session.getExam().getCourse().getCourseCode() : null)
                .courseName(session.getExam() != null && session.getExam().getCourse() != null ? session.getExam().getCourse().getCourseName() : null)
                .studentId(session.getStudent() != null ? session.getStudent().getUserId() : null)
                .studentName(session.getStudent() != null ? session.getStudent().getFullName() : null)
                .studentEmail(session.getStudent() != null ? session.getStudent().getEmail() : null)
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .status(session.getStatus())
                .finalScore(fg != null ? fg.getFinalScore() : null)
                .lecturerFeedback(fg != null ? fg.getLecturerFeedback() : null)
                .build();
    }
}
