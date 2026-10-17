package com.group2.aives.application.port.out;

import com.group2.aives.domain.model.ExamQuestion;
import com.group2.aives.domain.model.ExamQuestionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, ExamQuestionId> {
    List<ExamQuestion> findByExam_ExamIdOrderByQuestionOrderAsc(Long examId);
    void deleteByExam_ExamId(Long examId);
    long countByExam_ExamId(Long examId);
    void deleteByQuestion_QuestionId(Long questionId);
    boolean existsByQuestion_QuestionId(Long questionId);
}
