package com.group2.aives.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"course_document_content\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseDocumentContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "content_id")
    private Long contentId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false, unique = true)
    private CourseDocument document;

    @Column(name = "content_text", nullable = false, columnDefinition = "TEXT")
    private String contentText;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
