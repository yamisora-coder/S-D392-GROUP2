package com.group2.aives.repository;

import com.group2.aives.entity.QuestionRubric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRubricRepository extends JpaRepository<QuestionRubric, UUID> {
    List<QuestionRubric> findByQuestionId(UUID questionId);
}
