package com.group2.aives.domain.repository;

import com.group2.aives.domain.model.Question;
import com.group2.aives.domain.model.enums.BloomLevel;
import com.group2.aives.domain.model.enums.QuestionStatus;

import java.util.List;
import java.util.UUID;

public interface QuestionRepository extends BaseRepository<Question, UUID> {
    List<Question> findBySubjectId(UUID subjectId);
    List<Question> findByBloomLevel(BloomLevel bloomLevel);
    List<Question> findByStatus(QuestionStatus status);
    List<Question> filterQuestions(UUID subjectId, BloomLevel bloomLevel, QuestionStatus status);
}
