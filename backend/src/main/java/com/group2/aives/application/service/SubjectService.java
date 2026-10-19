package com.group2.aives.application.service;

import com.group2.aives.application.dto.request.SubjectRequest;
import com.group2.aives.application.dto.response.SubjectResponse;

import java.util.List;
import java.util.UUID;

public interface SubjectService {
    List<SubjectResponse> getAllSubjects();
    SubjectResponse getSubjectById(UUID id);
    SubjectResponse createSubject(SubjectRequest request);
    SubjectResponse updateSubject(UUID id, SubjectRequest request);
    void deleteSubject(UUID id);
}
