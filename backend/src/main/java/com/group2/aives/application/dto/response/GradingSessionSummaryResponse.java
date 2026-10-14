package com.group2.aives.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Một dòng trong danh sách ca thi cần giảng viên xem & chốt điểm. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradingSessionSummaryResponse {
    private Long sessionId;
    private String examTitle;
    private String courseCode;
    private String courseName;
    private String studentName;
    private String studentEmail;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer answeredTurns;
    private BigDecimal aiSuggestedScore;
    private Boolean aiScoreComplete;
    private BigDecimal finalScore;
}
