package com.group2.aives.infrastructure.persistence;

import com.group2.aives.domain.model.ExamSession;
import com.group2.aives.domain.repository.ExamSessionRepository;
import com.group2.aives.infrastructure.persistence.jpa.SpringDataExamSessionRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public class ExamSessionRepositoryAdapter extends JpaRepositoryAdapter<ExamSession, UUID>
        implements ExamSessionRepository {

    private final SpringDataExamSessionRepository jpa;

    public ExamSessionRepositoryAdapter(SpringDataExamSessionRepository jpa) {
        super(jpa);
        this.jpa = jpa;
    }

    @Override
    public List<ExamSession> findByExamId(UUID examId) {
        return jpa.findByExamId(examId);
    }

    @Override
    public List<ExamSession> findByStudentId(UUID studentId) {
        return jpa.findByStudentId(studentId);
    }
}
