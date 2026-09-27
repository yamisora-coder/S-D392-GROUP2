package com.group2.aives.dto.response;

import com.group2.aives.entity.enums.ExamSessionStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionResponse {
    private UUID id;
    private UUID examId;
    private String examTitle;
    private String subjectName;
    private UUID studentId;
    private String studentName;
    private String studentCode;
    private String studentEmail;
    private LocalDateTime scheduledStartTime;
    private ExamSessionStatus status;
    private Double aiSuggestedScore;
    private Double finalTeacherScore;
    private String teacherFeedback;
}
