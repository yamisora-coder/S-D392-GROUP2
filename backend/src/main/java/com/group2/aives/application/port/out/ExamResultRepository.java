package com.group2.aives.application.port.out;

import com.group2.aives.domain.model.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    Optional<ExamResult> findBySession_SessionId(Long sessionId);
}
