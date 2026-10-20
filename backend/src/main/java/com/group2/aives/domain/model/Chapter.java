package com.group2.aives.domain.model;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
@Entity @Table(name="chapters") @Getter @Setter @NoArgsConstructor
public class Chapter {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(nullable=false) private UUID subjectId;
    @Column(nullable=false) private String title;
    private int position;
}
