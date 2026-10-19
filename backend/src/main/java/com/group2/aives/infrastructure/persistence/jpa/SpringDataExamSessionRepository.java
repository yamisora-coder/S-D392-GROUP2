package com.group2.aives.infrastructure.persistence.jpa;

import com.group2.aives.domain.model.ExamSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SpringDataExamSessionRepository extends JpaRepository<ExamSession, UUID> {
    List<ExamSession> findByExamId(UUID examId);
    List<ExamSession> findByStudentId(UUID studentId);
}
