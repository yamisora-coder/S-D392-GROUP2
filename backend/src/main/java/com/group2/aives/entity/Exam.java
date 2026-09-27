package com.group2.aives.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "exams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false)
    private String title; // Tên kỳ thi (VD: Vấn đáp Cuối kỳ PRN231)

    @Builder.Default
    @Column(nullable = false)
    private Integer durationPerStudentMins = 15; // Thời lượng mỗi thí sinh (phút)

    @Builder.Default
    @Column(nullable = false)
    private Integer maxMainQuestions = 3; // Số câu hỏi chính tối đa

    @Builder.Default
    @Column(nullable = false)
    private Integer maxFollowupQuestions = 2; // Số câu hỏi đào sâu tối đa mỗi câu chính

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    @Builder.Default
    private List<ExamSession> sessions = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
