package com.group2.aives.infrastructure.persistence.jpa;

import com.group2.aives.domain.model.Question;
import com.group2.aives.domain.model.enums.BloomLevel;
import com.group2.aives.domain.model.enums.QuestionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SpringDataQuestionRepository extends JpaRepository<Question, UUID> {

    List<Question> findBySubjectId(UUID subjectId);

    List<Question> findByBloomLevel(BloomLevel bloomLevel);

    List<Question> findByStatus(QuestionStatus status);

    @Query("SELECT q FROM Question q WHERE " +
           "(:subjectId IS NULL OR q.subject.id = :subjectId) AND " +
           "(:bloomLevel IS NULL OR q.bloomLevel = :bloomLevel) AND " +
           "(:status IS NULL OR q.status = :status) " +
           "ORDER BY q.createdAt DESC")
    List<Question> filterQuestions(
            @Param("subjectId") UUID subjectId,
            @Param("bloomLevel") BloomLevel bloomLevel,
            @Param("status") QuestionStatus status);
}
