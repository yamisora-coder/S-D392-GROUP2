package com.group2.aives.application.service;

import com.group2.aives.application.dto.request.ExamRequest;
import com.group2.aives.application.dto.response.ExamResponse;
import com.group2.aives.domain.model.Course;
import com.group2.aives.domain.model.Exam;
import com.group2.aives.application.port.out.CourseRepository;
import com.group2.aives.application.port.out.ExamRepository;
import com.group2.aives.application.port.in.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamServiceImpl implements ExamService {

    private final ExamRepository examRepository;
    private final CourseRepository courseRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getAllExams() {
        return examRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ExamResponse getExamById(Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ thi với ID: " + id));
        return mapToResponse(exam);
    }

    @Override
    @Transactional
    public ExamResponse createExam(ExamRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học với ID: " + request.getCourseId()));

        Exam exam = Exam.builder()
                .course(course)
                .title(request.getTitle().trim())
                .durationMinutes(request.getDurationMinutes())
                .maxFollowUpPerQ(request.getMaxFollowUpPerQ() != null ? request.getMaxFollowUpPerQ() : 2)
                .build();

        Exam saved = examRepository.save(exam);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ExamResponse updateExam(Long id, ExamRequest request) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kỳ thi với ID: " + id));

        if (!exam.getCourse().getCourseId().equals(request.getCourseId())) {
            Course newCourse = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học với ID: " + request.getCourseId()));
            exam.setCourse(newCourse);
        }

        exam.setTitle(request.getTitle().trim());
        exam.setDurationMinutes(request.getDurationMinutes());
        if (request.getMaxFollowUpPerQ() != null) {
            exam.setMaxFollowUpPerQ(request.getMaxFollowUpPerQ());
        }

        Exam updated = examRepository.save(exam);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteExam(Long id) {
        if (!examRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy kỳ thi với ID: " + id);
        }
        examRepository.deleteById(id);
    }

    private ExamResponse mapToResponse(Exam exam) {
        return ExamResponse.builder()
                .id(exam.getExamId())
                .courseId(exam.getCourse() != null ? exam.getCourse().getCourseId() : null)
                .courseCode(exam.getCourse() != null ? exam.getCourse().getCourseCode() : null)
                .courseName(exam.getCourse() != null ? exam.getCourse().getCourseName() : null)
                .title(exam.getTitle())
                .durationMinutes(exam.getDurationMinutes())
                .maxFollowUpPerQ(exam.getMaxFollowUpPerQ())
                .sessionCount(exam.getSessions() != null ? exam.getSessions().size() : 0)
                .createdAt(exam.getCreatedAt())
                .build();
    }
}
