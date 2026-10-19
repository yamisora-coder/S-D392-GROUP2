package com.group2.aives.infrastructure.persistence.jpa;

import com.group2.aives.domain.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SpringDataExamRepository extends JpaRepository<Exam, UUID> {
    List<Exam> findBySubjectId(UUID subjectId);
}
