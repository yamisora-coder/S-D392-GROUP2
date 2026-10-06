package com.group2.aives.application.port.out;

import com.group2.aives.domain.model.ExamSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamSessionRepository extends JpaRepository<ExamSession, Long> {
    List<ExamSession> findByExam_ExamId(Long examId);
    List<ExamSession> findByStudent_UserId(Long studentId);
}
