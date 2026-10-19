package com.group2.aives.domain.repository;

import com.group2.aives.domain.model.Subject;

import java.util.Optional;
import java.util.UUID;

public interface SubjectRepository extends BaseRepository<Subject, UUID> {
    Optional<Subject> findByCode(String code);
    boolean existsByCode(String code);
}
