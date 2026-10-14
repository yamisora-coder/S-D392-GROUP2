package com.group2.aives.application.port.out;

import com.group2.aives.domain.model.CourseDocumentContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseDocumentContentRepository extends JpaRepository<CourseDocumentContent, Long> {
    Optional<CourseDocumentContent> findByDocument_DocumentId(Long documentId);
    boolean existsByDocument_DocumentId(Long documentId);
}
