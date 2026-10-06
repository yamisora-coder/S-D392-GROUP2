package com.group2.aives.application.service;

import com.group2.aives.application.dto.request.CourseRequest;
import com.group2.aives.application.dto.response.CourseResponse;
import com.group2.aives.domain.model.Course;
import com.group2.aives.domain.model.User;
import com.group2.aives.application.port.out.CourseRepository;
import com.group2.aives.application.port.out.UserRepository;
import com.group2.aives.application.port.in.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    @Override
    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học với ID: " + id));
        return mapToResponse(course);
    }

    @Override
    @Transactional
    public CourseResponse createCourse(CourseRequest request) {
        if (courseRepository.existsByCourseCode(request.getCourseCode())) {
            throw new RuntimeException("Mã môn học đã tồn tại: " + request.getCourseCode());
        }

        User managedBy = userRepository.findById(request.getManagedByUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giảng viên với ID: " + request.getManagedByUserId()));

        Course course = Course.builder()
                .courseCode(request.getCourseCode().toUpperCase().trim())
                .courseName(request.getCourseName().trim())
                .managedBy(managedBy)
                .build();

        Course saved = courseRepository.save(course);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CourseResponse updateCourse(Long id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học với ID: " + id));

        if (!course.getCourseCode().equalsIgnoreCase(request.getCourseCode()) 
                && courseRepository.existsByCourseCode(request.getCourseCode())) {
            throw new RuntimeException("Mã môn học đã tồn tại: " + request.getCourseCode());
        }

        User managedBy = userRepository.findById(request.getManagedByUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giảng viên với ID: " + request.getManagedByUserId()));

        course.setCourseCode(request.getCourseCode().toUpperCase().trim());
        course.setCourseName(request.getCourseName().trim());
        course.setManagedBy(managedBy);

        Course updated = courseRepository.save(course);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy môn học với ID: " + id);
        }
        courseRepository.deleteById(id);
    }

    private CourseResponse mapToResponse(Course course) {
        return CourseResponse.builder()
                .courseId(course.getCourseId())
                .courseCode(course.getCourseCode())
                .courseName(course.getCourseName())
                .managedByUserId(course.getManagedBy() != null ? course.getManagedBy().getUserId() : null)
                .managedByName(course.getManagedBy() != null ? course.getManagedBy().getFullName() : null)
                .questionCount(course.getQuestions() != null ? course.getQuestions().size() : 0)
                .examCount(course.getExams() != null ? course.getExams().size() : 0)
                .documentCount(course.getDocuments() != null ? course.getDocuments().size() : 0)
                .createdAt(course.getCreatedAt())
                .build();
    }
}
