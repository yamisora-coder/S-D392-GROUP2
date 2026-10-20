package com.group2.aives.infrastructure.config;
import com.group2.aives.infrastructure.persistence.jpa.AttemptRecordingJpaRepository;import lombok.RequiredArgsConstructor;import org.springframework.context.annotation.Configuration;import org.springframework.scheduling.annotation.*;
@Configuration @EnableScheduling @RequiredArgsConstructor
public class RecordingRetention {private final AttemptRecordingJpaRepository recordings;@Scheduled(fixedDelay=3600000,initialDelay=60000) public void clean(){recordings.removeExpired(java.time.LocalDateTime.now());}}
