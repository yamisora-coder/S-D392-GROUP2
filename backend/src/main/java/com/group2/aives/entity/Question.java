package com.group2.aives.entity;

import com.group2.aives.entity.enums.BloomLevel;
import com.group2.aives.entity.enums.QuestionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // Nội dung câu hỏi vấn đáp

    @Column(columnDefinition = "TEXT")
    private String sampleAnswer; // Đáp án mẫu / dàn ý gợi ý cho giám khảo & AI

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BloomLevel bloomLevel; // REMEMBER, UNDERSTAND, APPLY, ANALYZE

    @Builder.Default
    @Column(nullable = false)
    private Boolean isAiGenerated = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private QuestionStatus status = QuestionStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuestionRubric> rubrics = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Helper method to keep bi-directional relationship consistent
    public void addRubric(QuestionRubric rubric) {
        rubrics.add(rubric);
        rubric.setQuestion(this);
    }
}
