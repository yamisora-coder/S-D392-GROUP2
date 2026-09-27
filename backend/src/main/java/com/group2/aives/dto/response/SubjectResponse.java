package com.group2.aives.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectResponse {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private int questionCount;
    private int examCount;
    private LocalDateTime createdAt;
}
