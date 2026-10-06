package com.group2.aives.application.service;

import com.group2.aives.application.dto.request.RubricRequest;
import com.group2.aives.application.dto.response.RubricResponse;
import com.group2.aives.domain.model.Rubric;
import com.group2.aives.domain.model.RubricCriterion;
import com.group2.aives.application.port.out.RubricRepository;
import com.group2.aives.application.port.in.RubricService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RubricServiceImpl implements RubricService {

    private final RubricRepository rubricRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RubricResponse> getAllRubrics() {
        return rubricRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RubricResponse getRubricById(Long id) {
        Rubric rubric = rubricRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bộ Rubric với ID: " + id));
        return mapToResponse(rubric);
    }

    @Override
    @Transactional
    public RubricResponse createRubric(RubricRequest request) {
        Rubric rubric = Rubric.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .criteria(new ArrayList<>())
                .build();

        if (request.getCriteria() != null) {
            for (RubricRequest.CriterionRequest cr : request.getCriteria()) {
                RubricCriterion criterion = RubricCriterion.builder()
                        .rubric(rubric)
                        .criterionName(cr.getCriterionName().trim())
                        .maxScore(cr.getMaxScore())
                        .expectedAnswerKeywords(cr.getExpectedAnswerKeywords())
                        .build();
                rubric.addCriterion(criterion);
            }
        }

        Rubric saved = rubricRepository.save(rubric);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public RubricResponse updateRubric(Long id, RubricRequest request) {
        Rubric rubric = rubricRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bộ Rubric với ID: " + id));

        rubric.setName(request.getName().trim());
        rubric.setDescription(request.getDescription());

        rubric.getCriteria().clear();
        if (request.getCriteria() != null) {
            for (RubricRequest.CriterionRequest cr : request.getCriteria()) {
                RubricCriterion criterion = RubricCriterion.builder()
                        .rubric(rubric)
                        .criterionName(cr.getCriterionName().trim())
                        .maxScore(cr.getMaxScore())
                        .expectedAnswerKeywords(cr.getExpectedAnswerKeywords())
                        .build();
                rubric.addCriterion(criterion);
            }
        }

        Rubric updated = rubricRepository.save(rubric);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteRubric(Long id) {
        if (!rubricRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy bộ Rubric với ID: " + id);
        }
        rubricRepository.deleteById(id);
    }

    private RubricResponse mapToResponse(Rubric rubric) {
        List<RubricResponse.CriterionResponse> criteria = rubric.getCriteria().stream()
                .map(c -> RubricResponse.CriterionResponse.builder()
                        .criterionId(c.getCriterionId())
                        .criterionName(c.getCriterionName())
                        .maxScore(c.getMaxScore())
                        .expectedAnswerKeywords(c.getExpectedAnswerKeywords())
                        .build())
                .collect(Collectors.toList());

        BigDecimal total = criteria.stream()
                .map(RubricResponse.CriterionResponse::getMaxScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return RubricResponse.builder()
                .id(rubric.getRubricId())
                .name(rubric.getName())
                .description(rubric.getDescription())
                .criteria(criteria)
                .totalMaxScore(total)
                .build();
    }
}
