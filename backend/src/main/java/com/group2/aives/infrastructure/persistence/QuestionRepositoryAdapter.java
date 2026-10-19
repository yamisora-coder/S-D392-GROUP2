package com.group2.aives.infrastructure.persistence;

import com.group2.aives.domain.model.Question;
import com.group2.aives.domain.model.enums.BloomLevel;
import com.group2.aives.domain.model.enums.QuestionStatus;
import com.group2.aives.domain.repository.QuestionRepository;
import com.group2.aives.infrastructure.persistence.jpa.SpringDataQuestionRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public class QuestionRepositoryAdapter extends JpaRepositoryAdapter<Question, UUID> implements QuestionRepository {

    private final SpringDataQuestionRepository jpa;

    public QuestionRepositoryAdapter(SpringDataQuestionRepository jpa) {
        super(jpa);
        this.jpa = jpa;
    }

    @Override
    public List<Question> findBySubjectId(UUID subjectId) {
        return jpa.findBySubjectId(subjectId);
    }

    @Override
    public List<Question> findByBloomLevel(BloomLevel bloomLevel) {
        return jpa.findByBloomLevel(bloomLevel);
    }

    @Override
    public List<Question> findByStatus(QuestionStatus status) {
        return jpa.findByStatus(status);
    }

    @Override
    public List<Question> filterQuestions(UUID subjectId, BloomLevel bloomLevel, QuestionStatus status) {
        return jpa.filterQuestions(subjectId, bloomLevel, status);
    }
}
