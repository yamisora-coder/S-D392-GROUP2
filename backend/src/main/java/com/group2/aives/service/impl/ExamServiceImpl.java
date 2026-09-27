package com.group2.aives.service.impl;

import com.group2.aives.dto.request.ExamRequest;
import com.group2.aives.dto.response.ExamResponse;
import com.group2.aives.entity.Exam;
import com.group2.aives.entity.Subject;
import com.group2.aives.repository.ExamRepository;
import com.group2.aives.repository.SubjectRepository;
import com.group2.aives.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamServiceImpl implements ExamService {

    private final ExamRepository examRepository;
    private final SubjectRepository subjectRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getAllExams() {
        return examRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ExamResponse getExamById(UUID id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ thi với ID: " + id));
        return mapToResponse(exam);
    }

    @Override
    @Transactional
    public ExamResponse createExam(ExamRequest request) {
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học"));

        Exam exam = Exam.builder()
                .subject(subject)
                .title(request.getTitle().trim())
                .durationPerStudentMins(request.getDurationPerStudentMins())
                .maxMainQuestions(request.getMaxMainQuestions())
                .maxFollowupQuestions(request.getMaxFollowupQuestions())
                .build();

        Exam saved = examRepository.save(exam);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ExamResponse updateExam(UUID id, ExamRequest request) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ thi"));

        if (!exam.getSubject().getId().equals(request.getSubjectId())) {
            Subject newSubject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học"));
            exam.setSubject(newSubject);
        }

        exam.setTitle(request.getTitle().trim());
        exam.setDurationPerStudentMins(request.getDurationPerStudentMins());
        exam.setMaxMainQuestions(request.getMaxMainQuestions());
        exam.setMaxFollowupQuestions(request.getMaxFollowupQuestions());

        Exam updated = examRepository.save(exam);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteExam(UUID id) {
        if (!examRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy kỳ thi");
        }
        examRepository.deleteById(id);
    }

    private ExamResponse mapToResponse(Exam exam) {
        return ExamResponse.builder()
                .id(exam.getId())
                .subjectId(exam.getSubject().getId())
                .subjectCode(exam.getSubject().getCode())
                .subjectName(exam.getSubject().getName())
                .title(exam.getTitle())
                .durationPerStudentMins(exam.getDurationPerStudentMins())
                .maxMainQuestions(exam.getMaxMainQuestions())
                .maxFollowupQuestions(exam.getMaxFollowupQuestions())
                .sessionCount(exam.getSessions() != null ? exam.getSessions().size() : 0)
                .createdAt(exam.getCreatedAt())
                .build();
    }
}
