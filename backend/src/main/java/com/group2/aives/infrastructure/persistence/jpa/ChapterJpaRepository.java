package com.group2.aives.infrastructure.persistence.jpa;
import com.group2.aives.domain.model.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ChapterJpaRepository extends JpaRepository<Chapter,UUID> { List<Chapter> findBySubjectIdOrderByPositionAsc(UUID subjectId); }
