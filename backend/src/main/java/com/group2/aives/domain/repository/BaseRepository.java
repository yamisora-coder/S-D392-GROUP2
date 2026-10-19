package com.group2.aives.domain.repository;

import java.util.List;
import java.util.Optional;

/**
 * Port (domain contract) for aggregate persistence.
 * Implemented by the infrastructure layer; the domain/application layers
 * depend only on this abstraction (Dependency Inversion).
 */
public interface BaseRepository<T, ID> {
    List<T> findAll();
    Optional<T> findById(ID id);
    T save(T entity);
    boolean existsById(ID id);
    void deleteById(ID id);
    long count();
}
