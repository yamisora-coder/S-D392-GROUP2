package com.group2.aives.application.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group2.aives.domain.model.SystemSetting;
import com.group2.aives.infrastructure.persistence.jpa.SystemSettingJpaRepository;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;
@Service @RequiredArgsConstructor
public class SystemSettingsService {
 private final SystemSettingJpaRepository repository;private final ObjectMapper json;
 public record Options(@NotNull @Pattern(regexp="[A-Za-z0-9._-]{0,100}") String model,@NotNull @DecimalMin("0") @DecimalMax("1") Double temperature,@Min(5) @Max(30) int followupTimeoutSeconds,@Min(15) @Max(600) int answerTimeSeconds,@Min(1) @Max(365) int recordingRetentionDays) {}
 public Options get(){return repository.findById("runtime").map(row->{try{return json.readValue(row.getValueJson(),Options.class);}catch(Exception e){throw new IllegalStateException("Không đọc được cấu hình hệ thống");}}).orElse(new Options("",0.2,20,120,30));}
 @Transactional public Options save(Options options) throws Exception {var row=new SystemSetting();row.setId("runtime");row.setValueJson(json.writeValueAsString(options));repository.save(row);return options;}
}
