package com.group2.aives.entity;

import com.group2.aives.entity.enums.ExamSessionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exam_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false)
    private LocalDateTime scheduledStartTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ExamSessionStatus status = ExamSessionStatus.SCHEDULED;

    private Double aiSuggestedScore; // Điểm gợi ý từ AI (Thang 10)

    private Double finalTeacherScore; // Điểm Giảng viên chốt (Human-in-the-loop)

    @Column(columnDefinition = "TEXT")
    private String teacherFeedback; // Nhận xét của giảng viên

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
