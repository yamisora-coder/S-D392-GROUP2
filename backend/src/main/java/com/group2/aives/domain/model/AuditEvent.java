package com.group2.aives.domain.model;
import jakarta.persistence.*;import lombok.*;import java.time.LocalDateTime;import java.util.UUID;
@Entity @Getter @Setter @NoArgsConstructor
public class AuditEvent {
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
 private LocalDateTime timestamp;private String actor;private String role;private String action;private String target;private String ip;private int httpStatus;private String status;
}
