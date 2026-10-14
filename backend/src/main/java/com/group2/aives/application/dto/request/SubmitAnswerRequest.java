package com.group2.aives.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitAnswerRequest {

    // Văn bản câu trả lời (frontend dùng Web Speech API chuyển giọng nói → text rồi gửi lên)
    @NotBlank(message = "Nội dung câu trả lời không được để trống")
    private String sttText;

    // URL file âm thanh (tuỳ chọn — frontend upload trước rồi gửi URL)
    private String audioUrl;

    // Thời gian sinh viên trả lời (giây)
    private Integer answerDurationSeconds;
}
