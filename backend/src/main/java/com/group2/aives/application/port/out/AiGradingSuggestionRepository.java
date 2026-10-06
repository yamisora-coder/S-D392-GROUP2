package com.group2.aives.application.port.out;

import com.group2.aives.domain.model.AiGradingSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiGradingSuggestionRepository extends JpaRepository<AiGradingSuggestion, Long> {
    Optional<AiGradingSuggestion> findByTurn_TurnId(Long turnId);
}
