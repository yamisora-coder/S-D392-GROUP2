package com.group2.aives.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionRequest {

    @NotNull(message = "Kỳ thi không được để trống")
    private UUID examId;

    @NotNull(message = "Sinh viên không được để trống")
    private UUID studentId;

    @NotNull(message = "Thời gian thi không được để trống")
    private LocalDateTime scheduledStartTime;
}
