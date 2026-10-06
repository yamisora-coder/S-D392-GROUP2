package com.group2.aives.application.port.out;

import com.group2.aives.domain.model.CourseDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseDocumentRepository extends JpaRepository<CourseDocument, Long> {
    List<CourseDocument> findByCourse_CourseId(Long courseId);
}
