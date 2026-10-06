package com.group2.aives.application.port.out;

import com.group2.aives.domain.model.RubricCriterion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RubricCriterionRepository extends JpaRepository<RubricCriterion, Long> {
    List<RubricCriterion> findByRubric_RubricId(Long rubricId);
}
