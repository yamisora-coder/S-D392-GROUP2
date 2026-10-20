package com.group2.aives.infrastructure.persistence.jpa;
import com.group2.aives.domain.model.AuditEvent;import org.springframework.data.jpa.repository.JpaRepository;
public interface AuditEventJpaRepository extends JpaRepository<AuditEvent,java.util.UUID> {}
