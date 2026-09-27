package com.group2.aives.repository;

import com.group2.aives.entity.ExamSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExamSessionRepository extends JpaRepository<ExamSession, UUID> {
    List<ExamSession> findByExamId(UUID examId);
    List<ExamSession> findByStudentId(UUID studentId);
}
