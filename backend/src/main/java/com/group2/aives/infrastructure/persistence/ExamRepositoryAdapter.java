package com.group2.aives.infrastructure.persistence;

import com.group2.aives.domain.model.Exam;
import com.group2.aives.domain.repository.ExamRepository;
import com.group2.aives.infrastructure.persistence.jpa.SpringDataExamRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public class ExamRepositoryAdapter extends JpaRepositoryAdapter<Exam, UUID> implements ExamRepository {

    private final SpringDataExamRepository jpa;

    public ExamRepositoryAdapter(SpringDataExamRepository jpa) {
        super(jpa);
        this.jpa = jpa;
    }

    @Override
    public List<Exam> findBySubjectId(UUID subjectId) {
        return jpa.findBySubjectId(subjectId);
    }
}
