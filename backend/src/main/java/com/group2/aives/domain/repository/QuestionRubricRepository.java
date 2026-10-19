package com.group2.aives.domain.repository;

import com.group2.aives.domain.model.QuestionRubric;

import java.util.List;
import java.util.UUID;

public interface QuestionRubricRepository extends BaseRepository<QuestionRubric, UUID> {
    List<QuestionRubric> findByQuestionId(UUID questionId);
}
