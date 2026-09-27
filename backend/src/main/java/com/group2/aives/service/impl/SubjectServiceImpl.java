package com.group2.aives.service.impl;

import com.group2.aives.dto.request.SubjectRequest;
import com.group2.aives.dto.response.SubjectResponse;
import com.group2.aives.entity.Subject;
import com.group2.aives.repository.SubjectRepository;
import com.group2.aives.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponse> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectResponse getSubjectById(UUID id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học với ID: " + id));
        return mapToResponse(subject);
    }

    @Override
    @Transactional
    public SubjectResponse createSubject(SubjectRequest request) {
        if (subjectRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Mã môn học đã tồn tại: " + request.getCode());
        }

        Subject subject = Subject.builder()
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .description(request.getDescription())
                .build();

        Subject saved = subjectRepository.save(subject);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public SubjectResponse updateSubject(UUID id, SubjectRequest request) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học với ID: " + id));

        subject.setName(request.getName().trim());
        subject.setDescription(request.getDescription());

        Subject updated = subjectRepository.save(subject);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteSubject(UUID id) {
        if (!subjectRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy môn học với ID: " + id);
        }
        subjectRepository.deleteById(id);
    }

    private SubjectResponse mapToResponse(Subject subject) {
        return SubjectResponse.builder()
                .id(subject.getId())
                .code(subject.getCode())
                .name(subject.getName())
                .description(subject.getDescription())
                .questionCount(subject.getQuestions() != null ? subject.getQuestions().size() : 0)
                .examCount(subject.getExams() != null ? subject.getExams().size() : 0)
                .createdAt(subject.getCreatedAt())
                .build();
    }
}
