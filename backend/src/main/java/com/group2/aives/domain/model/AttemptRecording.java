package com.group2.aives.domain.model;
import jakarta.persistence.*;import lombok.*;import java.time.LocalDateTime;import java.util.UUID;
@Entity @Getter @Setter @NoArgsConstructor
@Table(indexes=@Index(columnList="sessionId"))
public class AttemptRecording {
 @Id private String id;@Column(nullable=false) private UUID sessionId;private int sequence;
 private String recordingId;private String contentType;private String digest;private long bytes;private LocalDateTime expiresAt;
 @Column(columnDefinition="bytea",nullable=false) private byte[] data;
}
