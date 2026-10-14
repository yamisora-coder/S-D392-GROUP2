package com.group2.aives.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseDocumentRequest {

    @NotNull(message = "Môn học không được để trống")
    private Long courseId;

    @NotBlank(message = "Tên tài liệu không được để trống")
    private String fileName;

    @NotBlank(message = "Đường dẫn tài liệu không được để trống")
    private String fileUrl;

    // Nội dung văn bản trích xuất từ tài liệu (dùng cho RAG/AI sinh câu hỏi)
    private String contentText;
}
