package com.group2.aives.domain.model;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
@Entity @Getter @Setter @NoArgsConstructor
public class RubricTemplate {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    private String name;
    @Column(columnDefinition="TEXT") private String criteriaJson;
}
