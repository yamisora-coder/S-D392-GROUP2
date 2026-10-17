package com.group2.aives.application.dto.request;

import com.group2.aives.domain.enums.BloomLevel;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateQuestionsRequest {

    @NotNull(message = "Môn học không được để trống")
    private Long courseId;

    @NotNull(message = "Bộ Rubric chấm điểm không được để trống")
    private Long rubricId;

    @NotBlank(message = "Chủ đề câu hỏi không được để trống")
    private String topic;

    // Nếu null thì AI sẽ tự chọn phân bổ mức Bloom phù hợp
    private BloomLevel bloomLevel;

    @Builder.Default
    @Min(value = 1, message = "Số câu hỏi tối thiểu là 1")
    @Max(value = 20, message = "Số câu hỏi tối đa là 20")
    private Integer questionCount = 5;

    // ID các tài liệu môn học dùng làm ngữ cảnh cho AI (RAG)
    private List<Long> documentIds;

    // Ngữ cảnh bổ sung do giảng viên nhập thêm (ngoài tài liệu)
    private String additionalContext;
}
