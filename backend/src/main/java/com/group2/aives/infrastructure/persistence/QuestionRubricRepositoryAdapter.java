package com.group2.aives.infrastructure.persistence;

import com.group2.aives.domain.model.QuestionRubric;
import com.group2.aives.domain.repository.QuestionRubricRepository;
import com.group2.aives.infrastructure.persistence.jpa.SpringDataQuestionRubricRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public class QuestionRubricRepositoryAdapter extends JpaRepositoryAdapter<QuestionRubric, UUID>
        implements QuestionRubricRepository {

    private final SpringDataQuestionRubricRepository jpa;

    public QuestionRubricRepositoryAdapter(SpringDataQuestionRubricRepository jpa) {
        super(jpa);
        this.jpa = jpa;
    }

    @Override
    public List<QuestionRubric> findByQuestionId(UUID questionId) {
        return jpa.findByQuestionId(questionId);
    }
}
