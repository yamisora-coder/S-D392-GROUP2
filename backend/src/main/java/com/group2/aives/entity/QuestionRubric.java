package com.group2.aives.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "question_rubrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionRubric {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    @JsonIgnore
    private Question question;

    @Column(nullable = false)
    private String criteriaName; // Tên tiêu chí: VD: "Nắm khái niệm", "Ví dụ minh họa", "Lập luận logic"

    @Column(nullable = false)
    private Double maxScore; // Thang điểm cho tiêu chí này (VD: 3.0, 4.0)

    @Column(columnDefinition = "TEXT")
    private String description; // Mô tả cách đạt điểm
}
