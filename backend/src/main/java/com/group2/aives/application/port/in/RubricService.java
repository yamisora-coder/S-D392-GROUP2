package com.group2.aives.application.port.in;

import com.group2.aives.application.dto.request.RubricRequest;
import com.group2.aives.application.dto.response.RubricResponse;

import java.util.List;

public interface RubricService {
    List<RubricResponse> getAllRubrics();
    RubricResponse getRubricById(Long id);
    RubricResponse createRubric(RubricRequest request);
    RubricResponse updateRubric(Long id, RubricRequest request);
    void deleteRubric(Long id);
}
