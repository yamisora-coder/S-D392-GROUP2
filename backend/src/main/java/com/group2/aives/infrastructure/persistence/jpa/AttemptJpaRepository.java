package com.group2.aives.infrastructure.persistence.jpa;
import com.group2.aives.domain.model.ExamAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface AttemptJpaRepository extends JpaRepository<ExamAttempt,UUID> {
 @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
 @org.springframework.data.jpa.repository.Query("select a from ExamAttempt a where a.sessionId=:id")
 java.util.Optional<ExamAttempt> lockById(UUID id);
}
