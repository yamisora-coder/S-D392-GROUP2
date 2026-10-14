package com.group2.aives.application.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamQuestionRequest {

    @NotNull(message = "ID câu hỏi không được để trống")
    private Long questionId;

    @NotNull(message = "Thứ tự câu hỏi không được để trống")
    @Min(value = 1, message = "Thứ tự tối thiểu là 1")
    private Integer questionOrder;
}
