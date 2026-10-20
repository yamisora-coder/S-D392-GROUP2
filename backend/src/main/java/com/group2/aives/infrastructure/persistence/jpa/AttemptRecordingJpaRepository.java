package com.group2.aives.infrastructure.persistence.jpa;
import com.group2.aives.domain.model.AttemptRecording;import org.springframework.data.jpa.repository.*;import org.springframework.transaction.annotation.Transactional;import java.util.*;import java.time.LocalDateTime;
public interface AttemptRecordingJpaRepository extends JpaRepository<AttemptRecording,String> {
 interface Metadata {int getSequence();String getRecordingId();String getContentType();long getBytes();LocalDateTime getExpiresAt();}
 List<Metadata> findBySessionIdAndExpiresAtAfterOrderBySequenceAsc(UUID id,LocalDateTime now);
 @Query("select coalesce(sum(r.bytes),0) from AttemptRecording r where r.sessionId=:id") long totalBytes(UUID id);
 @Modifying @Transactional @Query("delete from AttemptRecording r where r.sessionId=:id") void removeSession(UUID id);
 @Modifying @Transactional @Query("delete from AttemptRecording r where r.expiresAt<:now") void removeExpired(LocalDateTime now);
}
