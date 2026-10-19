package com.group2.aives.infrastructure.persistence.jpa;

import com.group2.aives.domain.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataSubjectRepository extends JpaRepository<Subject, UUID> {
    Optional<Subject> findByCode(String code);
    boolean existsByCode(String code);
}
