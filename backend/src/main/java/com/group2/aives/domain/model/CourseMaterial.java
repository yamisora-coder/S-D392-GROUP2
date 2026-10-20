package com.group2.aives.domain.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity @Getter @Setter @NoArgsConstructor
public class CourseMaterial {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(nullable=false) private UUID chapterId;
    private String filename;
    private LocalDateTime uploadedAt;
    @Column(columnDefinition="TEXT") private String chunksJson;
    @com.fasterxml.jackson.annotation.JsonIgnore @Column(columnDefinition="TEXT") private String searchIndexJson;
}
