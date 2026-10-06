package com.group2.aives.application.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionRequest {

    @NotNull(message = "Kỳ thi không được để trống")
    private Long examId;

    @NotNull(message = "Sinh viên không được để trống")
    private Long studentId;

    @NotNull(message = "Thời gian thi không được để trống")
    private LocalDateTime scheduledStartTime;
}
