package com.group2.aives.application.port.out;

import com.group2.aives.domain.model.Transcript;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TranscriptRepository extends JpaRepository<Transcript, Long> {
    Optional<Transcript> findByTurn_TurnId(Long turnId);
}
