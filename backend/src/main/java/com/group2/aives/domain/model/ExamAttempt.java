package com.group2.aives.domain.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity @Getter @Setter @NoArgsConstructor
public class ExamAttempt {
    @Id private UUID sessionId;
    @Version private Long version;
    private LocalDateTime startedAt;
    private LocalDateTime deadline;
    private LocalDateTime submittedAt;
    private LocalDateTime recordingConsentAt;
    private LocalDateTime recordingExpiresAt;
    @Column(columnDefinition="TEXT") private String questionsJson;
    @Column(columnDefinition="TEXT") private String answersJson;
    @Column(columnDefinition="TEXT") private String gradingJson;
    @Column(columnDefinition="TEXT") private String followupsJson;
    private Integer maxFollowupsPerQuestion;
    private Integer answerTimeSeconds;
    @Column(columnDefinition="TEXT") private String answerDeadlinesJson;
}
