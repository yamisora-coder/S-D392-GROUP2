package com.group2.aives.infrastructure.persistence;

import com.group2.aives.domain.model.Subject;
import com.group2.aives.domain.repository.SubjectRepository;
import com.group2.aives.infrastructure.persistence.jpa.SpringDataSubjectRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class SubjectRepositoryAdapter extends JpaRepositoryAdapter<Subject, UUID> implements SubjectRepository {

    private final SpringDataSubjectRepository jpa;

    public SubjectRepositoryAdapter(SpringDataSubjectRepository jpa) {
        super(jpa);
        this.jpa = jpa;
    }

    @Override
    public Optional<Subject> findByCode(String code) {
        return jpa.findByCode(code);
    }

    @Override
    public boolean existsByCode(String code) {
        return jpa.existsByCode(code);
    }
}
