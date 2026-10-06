package com.group2.aives.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.group2.aives.domain.enums.TurnType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "\"session_turn\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionTurn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "turn_id")
    private Long turnId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ExamSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_turn_id")
    private SessionTurn parentTurn;

    @OneToMany(mappedBy = "parentTurn", cascade = CascadeType.ALL)
    @JsonIgnore
    @Builder.Default
    private List<SessionTurn> followUpTurns = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "turn_type", nullable = false, columnDefinition = "turn_type_enum")
    private TurnType turnType;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    @Column(name = "time_limit_seconds", nullable = false)
    private Integer timeLimitSeconds;

    @OneToOne(mappedBy = "turn", cascade = CascadeType.ALL, orphanRemoval = true)
    private Transcript transcript;

    @OneToOne(mappedBy = "turn", cascade = CascadeType.ALL, orphanRemoval = true)
    private AiGradingSuggestion aiGradingSuggestion;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
