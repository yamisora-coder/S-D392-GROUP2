package com.group2.aives.application.port.out;

import com.group2.aives.domain.model.SessionTurn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionTurnRepository extends JpaRepository<SessionTurn, Long> {
    List<SessionTurn> findBySession_SessionIdOrderBySequenceNumberAsc(Long sessionId);
}
