package com.group2.aives.infrastructure.persistence.jpa;

import com.group2.aives.domain.model.QuestionRubric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SpringDataQuestionRubricRepository extends JpaRepository<QuestionRubric, UUID> {
    List<QuestionRubric> findByQuestionId(UUID questionId);
}
