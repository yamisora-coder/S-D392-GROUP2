package com.group2.aives.application.port.out;

import com.group2.aives.domain.model.Question;
import com.group2.aives.domain.enums.BloomLevel;
import com.group2.aives.domain.enums.QuestionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long>, JpaSpecificationExecutor<Question> {

    List<Question> findByCourse_CourseId(Long courseId);

    List<Question> findByBloomLevel(BloomLevel bloomLevel);

    List<Question> findByStatus(QuestionStatus status);
}
