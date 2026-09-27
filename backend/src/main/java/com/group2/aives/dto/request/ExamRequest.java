package com.group2.aives.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamRequest {

    @NotNull(message = "Môn học không được để trống")
    private UUID subjectId;

    @NotBlank(message = "Tên kỳ thi không được để trống")
    private String title;

    @NotNull(message = "Thời lượng thi không được để trống")
    @Min(value = 1, message = "Thời lượng thi tối thiểu 1 phút")
    private Integer durationPerStudentMins;

    @NotNull(message = "Số câu hỏi chính không được để trống")
    @Min(value = 1, message = "Tối thiểu 1 câu hỏi chính")
    private Integer maxMainQuestions;

    @NotNull(message = "Số câu hỏi đào sâu tối đa không được để trống")
    @Min(value = 0, message = "Số câu hỏi đào sâu không âm")
    private Integer maxFollowupQuestions;
}
