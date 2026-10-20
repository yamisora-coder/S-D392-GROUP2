package com.group2.aives.domain.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Getter @Setter @NoArgsConstructor
public class GenerationReceipt {
    @Id private String id;
    @Column(nullable=false) private String fingerprint;
    @Column(columnDefinition="TEXT") private String responseJson;
    private LocalDateTime createdAt;
}
