package com.group2.aives.application.dto.response;

import com.group2.aives.domain.enums.BloomLevel;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamQuestionResponse {
    private Long examId;
    private String examTitle;
    private Long questionId;
    private String questionText;
    private String sampleAnswer;
    private BloomLevel bloomLevel;
    private Short difficulty;
    private Long rubricId;
    private String rubricName;
    private Integer questionOrder;
}
