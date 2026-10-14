package com.group2.aives.application.port.in;

import com.group2.aives.application.dto.request.SubmitAnswerRequest;
import com.group2.aives.application.dto.response.InterviewTurnResponse;

import java.util.List;

public interface AiInterviewService {

    /** Bắt đầu hoặc tiếp tục phiên vấn đáp — trả về lượt hỏi hiện tại */
    InterviewTurnResponse startSession(Long sessionId);

    /** Nộp câu trả lời, AI phân tích và trả về câu hỏi xoáy hoặc câu tiếp theo */
    InterviewTurnResponse submitAnswer(Long sessionId, Long turnId, SubmitAnswerRequest request);

    /** Lấy lượt hỏi hiện tại chưa được trả lời của phiên */
    InterviewTurnResponse getCurrentTurn(Long sessionId);

    /** Lấy toàn bộ lịch sử các lượt hỏi trong phiên */
    List<InterviewTurnResponse> getSessionTurns(Long sessionId);
}
