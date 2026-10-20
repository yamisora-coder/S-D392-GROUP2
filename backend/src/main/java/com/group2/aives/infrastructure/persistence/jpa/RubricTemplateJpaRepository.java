package com.group2.aives.infrastructure.persistence.jpa;
import com.group2.aives.domain.model.RubricTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface RubricTemplateJpaRepository extends JpaRepository<RubricTemplate,UUID> {}
