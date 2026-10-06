package com.group2.aives.application.port.out;

import com.group2.aives.domain.model.FinalGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FinalGradeRepository extends JpaRepository<FinalGrade, Long> {
    Optional<FinalGrade> findBySession_SessionId(Long sessionId);
}
