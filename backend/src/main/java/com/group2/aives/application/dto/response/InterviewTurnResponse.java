package com.group2.aives.application.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewTurnResponse {

    // Thông tin lượt hỏi hiện tại
    private Long turnId;
    private Long sessionId;
    private Long questionId;
    private String turnType;         // MAIN | FOLLOW_UP
    private String questionText;     // AI đọc câu hỏi này (TTS)
    private Integer timeLimitSeconds;
    private Integer sequenceNumber;

    // Trạng thái follow-up
    private Integer followUpCount;       // số lần đã hỏi xoáy cho câu chính này
    private Integer maxFollowUpAllowed;  // giới hạn từ cấu hình đề thi

    // Trạng thái phiên thi
    private String sessionStatus;  // ONGOING | COMPLETED
    private String nextAction;     // ANSWER_REQUIRED | SESSION_COMPLETE

    // Phản hồi của AI về câu trả lời vừa rồi (hiển thị trước khi đặt câu hỏi tiếp)
    private String aiFeedback;

    // Transcript câu trả lời của sinh viên (STT text)
    private String studentAnswer;

    // Gợi ý chấm điểm của AI (sau khi sinh viên đã trả lời)
    private Double suggestedScore;
    private String strengths;
    private String weaknesses;
    private String missingPoints;
}
