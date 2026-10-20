package com.group2.aives.infrastructure.persistence.jpa;
import com.group2.aives.domain.model.CourseMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface MaterialJpaRepository extends JpaRepository<CourseMaterial,UUID> {List<CourseMaterial> findByChapterIdOrderByUploadedAtDesc(UUID chapterId);}
