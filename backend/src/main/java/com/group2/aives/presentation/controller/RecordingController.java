package com.group2.aives.presentation.controller;
import com.group2.aives.application.service.*;import com.group2.aives.domain.model.*;import com.group2.aives.domain.model.enums.Role;import com.group2.aives.infrastructure.persistence.jpa.*;
import jakarta.servlet.http.HttpServletRequest;import lombok.RequiredArgsConstructor;import org.springframework.http.*;import org.springframework.web.bind.annotation.*;import org.springframework.web.multipart.MultipartFile;import org.springframework.transaction.annotation.Transactional;import org.springframework.web.server.ResponseStatusException;import java.time.LocalDateTime;import java.util.*;
@RestController @RequiredArgsConstructor
public class RecordingController {
 private final AttemptService service;private final AttemptJpaRepository attempts;private final AttemptRecordingJpaRepository recordings;private final SystemSettingsService settings;
 private User actor(HttpServletRequest r){return (User)r.getAttribute("actor");}
 private ExamAttempt owner(UUID id,User actor) throws Exception {service.get(id,actor);if(actor.getRole()!=Role.STUDENT)throw new ResponseStatusException(HttpStatus.FORBIDDEN);return attempts.lockById(id).orElseThrow();}
 @PostMapping("/api/sessions/{id}/recording-consent") @Transactional public Map<String,Object> consent(@PathVariable UUID id,@RequestBody Map<String,Boolean> input,HttpServletRequest req) throws Exception {
  var a=owner(id,actor(req));if(!Boolean.TRUE.equals(input.get("accepted")))throw new IllegalArgumentException("Cần đồng ý ghi âm trước");
  if(a.getSubmittedAt()!=null||LocalDateTime.now().isAfter(a.getDeadline()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Bài đã nộp hoặc hết giờ");
  if(a.getRecordingConsentAt()==null){a.setRecordingConsentAt(LocalDateTime.now());a.setRecordingExpiresAt(LocalDateTime.now().plusDays(settings.get().recordingRetentionDays()));attempts.saveAndFlush(a);}
  return Map.of("expiresAt",a.getRecordingExpiresAt(),"maxBytes",50*1024*1024);
 }
 @PostMapping("/api/sessions/{id}/recordings") @Transactional public Map<String,Object> upload(@PathVariable UUID id,@RequestParam int sequence,@RequestParam UUID recordingId,@RequestParam MultipartFile file,HttpServletRequest req) throws Exception {
  var a=owner(id,actor(req));if(a.getRecordingConsentAt()==null||!a.getRecordingExpiresAt().isAfter(LocalDateTime.now()))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Chưa đồng ý hoặc đã hết thời hạn lưu ghi âm");
  if(LocalDateTime.now().isAfter(a.getSubmittedAt()==null?a.getDeadline().plusMinutes(2):a.getSubmittedAt().plusMinutes(2)))throw new ResponseStatusException(HttpStatus.CONFLICT,"Đã hết thời hạn tải bản ghi");
  String type=Objects.requireNonNullElse(file.getContentType(),"").split(";")[0];if(sequence<0||sequence>1000||file.isEmpty()||file.getSize()>2*1024*1024||!Set.of("audio/webm","audio/ogg","audio/mp4").contains(type))throw new IllegalArgumentException("Bản ghi cần audio/webm, ogg hoặc mp4, tối đa 2MB/đoạn");
  byte[] data=file.getBytes();String digest=HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(data));String key=id+":"+sequence;
  var old=recordings.findById(key);if(old.isPresent()){if(!old.get().getDigest().equals(digest))throw new ResponseStatusException(HttpStatus.CONFLICT,"Số thứ tự đã có bản ghi khác");return Map.of("sequence",sequence,"saved",true);}
  if(recordings.totalBytes(id)+data.length>50L*1024*1024)throw new IllegalArgumentException("Tối đa 50MB bản ghi mỗi ca thi");
  var row=new AttemptRecording();row.setId(key);row.setSessionId(id);row.setSequence(sequence);row.setRecordingId(recordingId.toString());row.setContentType(type);row.setDigest(digest);row.setBytes(data.length);row.setData(data);row.setExpiresAt(a.getRecordingExpiresAt());recordings.save(row);return Map.of("sequence",sequence,"saved",true);
 }
 @GetMapping("/api/sessions/{id}/recordings") public List<AttemptRecordingJpaRepository.Metadata> list(@PathVariable UUID id,HttpServletRequest req) throws Exception {service.get(id,actor(req));return recordings.findBySessionIdAndExpiresAtAfterOrderBySequenceAsc(id,LocalDateTime.now());}
 @GetMapping("/api/sessions/{id}/recordings/{sequence}") public ResponseEntity<byte[]> audio(@PathVariable UUID id,@PathVariable int sequence,HttpServletRequest req) throws Exception {
  service.get(id,actor(req));var row=recordings.findById(id+":"+sequence).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));if(!row.getExpiresAt().isAfter(LocalDateTime.now()))throw new ResponseStatusException(HttpStatus.GONE,"Bản ghi đã hết thời hạn lưu");return ResponseEntity.ok().contentType(MediaType.parseMediaType(row.getContentType())).cacheControl(CacheControl.noStore()).header("X-Content-Type-Options","nosniff").body(row.getData());
 }
 @DeleteMapping("/api/sessions/{id}/recordings") @Transactional public void withdraw(@PathVariable UUID id,HttpServletRequest req) throws Exception {
  var user=actor(req);service.get(id,user);if(user.getRole()!=Role.STUDENT&&user.getRole()!=Role.ADMIN)throw new ResponseStatusException(HttpStatus.FORBIDDEN);recordings.removeSession(id);var a=attempts.findById(id).orElseThrow();a.setRecordingConsentAt(null);a.setRecordingExpiresAt(null);attempts.save(a);
 }
}
