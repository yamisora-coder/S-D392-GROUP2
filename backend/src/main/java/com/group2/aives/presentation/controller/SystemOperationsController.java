package com.group2.aives.presentation.controller;
import com.group2.aives.application.service.SystemSettingsService;
import com.group2.aives.infrastructure.persistence.jpa.AuditEventJpaRepository;
import com.group2.aives.domain.model.AuditEvent;
import jakarta.validation.Valid;import lombok.RequiredArgsConstructor;import org.springframework.data.domain.*;import org.springframework.web.bind.annotation.*;import java.util.*;
@RestController @RequiredArgsConstructor @RequestMapping("/api")
public class SystemOperationsController {
 private final SystemSettingsService settings;private final AuditEventJpaRepository events;
 @GetMapping("/admin/settings") public SystemSettingsService.Options get(){return settings.get();}
 @PutMapping("/admin/settings") public SystemSettingsService.Options save(@Valid @RequestBody SystemSettingsService.Options input) throws Exception{return settings.save(input);}
 @GetMapping("/admin/audit") public List<AuditEvent> audit(@RequestParam(defaultValue="100") int limit){return events.findAll(PageRequest.of(0,Math.max(1,Math.min(500,limit)),Sort.by("timestamp").descending())).getContent();}
 @GetMapping("/runtime-options") public Map<String,Object> runtime(){var o=settings.get();return Map.of("answerTimeSeconds",o.answerTimeSeconds(),"recordingRetentionDays",o.recordingRetentionDays(),"followupTimeoutSeconds",o.followupTimeoutSeconds());}
}
