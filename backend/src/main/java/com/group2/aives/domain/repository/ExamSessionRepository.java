package com.group2.aives.domain.repository;

import com.group2.aives.domain.model.ExamSession;

import java.util.List;
import java.util.UUID;

public interface ExamSessionRepository extends BaseRepository<ExamSession, UUID> {
    List<ExamSession> findByExamId(UUID examId);
    List<ExamSession> findByStudentId(UUID studentId);
}
