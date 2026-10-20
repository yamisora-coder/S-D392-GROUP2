package com.group2.aives.infrastructure.persistence.jpa;
import com.group2.aives.domain.model.GenerationReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
public interface GenerationReceiptJpaRepository extends JpaRepository<GenerationReceipt,String> {}
