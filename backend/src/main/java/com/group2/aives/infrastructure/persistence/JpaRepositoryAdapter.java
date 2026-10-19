package com.group2.aives.infrastructure.persistence;

import com.group2.aives.domain.repository.BaseRepository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Shared adapter delegating the generic port operations to a Spring Data repository.
 */
public abstract class JpaRepositoryAdapter<T, ID> implements BaseRepository<T, ID> {

    private final JpaRepository<T, ID> jpa;

    protected JpaRepositoryAdapter(JpaRepository<T, ID> jpa) {
        this.jpa = jpa;
    }

    @Override
    public List<T> findAll() {
        return jpa.findAll();
    }

    @Override
    public Optional<T> findById(ID id) {
        return jpa.findById(id);
    }

    @Override
    public T save(T entity) {
        return jpa.save(entity);
    }

    @Override
    public boolean existsById(ID id) {
        return jpa.existsById(id);
    }

    @Override
    public void deleteById(ID id) {
        jpa.deleteById(id);
    }

    @Override
    public long count() {
        return jpa.count();
    }
}
