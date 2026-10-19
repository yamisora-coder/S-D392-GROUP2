package com.group2.aives.domain.repository;

import com.group2.aives.domain.model.Exam;

import java.util.List;
import java.util.UUID;

public interface ExamRepository extends BaseRepository<Exam, UUID> {
    List<Exam> findBySubjectId(UUID subjectId);
}
