package com.group2.aives.application.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group2.aives.application.dto.request.GenerateQuestionsRequest;
import com.group2.aives.application.dto.response.QuestionGenerationRequestResponse;
import com.group2.aives.application.dto.response.QuestionResponse;
import com.group2.aives.application.port.in.AiQuestionGenerationService;
import com.group2.aives.application.port.out.*;
import com.group2.aives.domain.enums.BloomLevel;
import com.group2.aives.domain.enums.QuestionSource;
import com.group2.aives.domain.enums.QuestionStatus;
import com.group2.aives.domain.model.*;
import com.group2.aives.infrastructure.ai.OpenAiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiQuestionGenerationServiceImpl implements AiQuestionGenerationService {

    private final QuestionGenerationRequestRepository generationRequestRepository;
    private final QuestionRepository questionRepository;
    private final CourseRepository courseRepository;
    private final RubricRepository rubricRepository;
    private final UserRepository userRepository;
    private final CourseDocumentRepository courseDocumentRepository;
    private final CourseDocumentContentRepository courseDocumentContentRepository;
    private final OpenAiClient openAiClient;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public QuestionGenerationRequestResponse generateQuestions(GenerateQuestionsRequest request, Long requestedByUserId) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học với ID: " + request.getCourseId()));

        Rubric rubric = rubricRepository.findById(request.getRubricId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bộ Rubric với ID: " + request.getRubricId()));

        User requestedBy = userRepository.findById(requestedByUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + requestedByUserId));

        // Tập hợp tài liệu được chọn
        Set<CourseDocument> selectedDocs = new HashSet<>();
        StringBuilder contextBuilder = new StringBuilder();

        if (request.getDocumentIds() != null && !request.getDocumentIds().isEmpty()) {
            for (Long docId : request.getDocumentIds()) {
                courseDocumentRepository.findById(docId).ifPresent(doc -> {
                    selectedDocs.add(doc);
                    courseDocumentContentRepository.findByDocument_DocumentId(docId).ifPresent(content -> {
                        contextBuilder.append("\n--- Tài liệu: ").append(doc.getFileName()).append(" ---\n");
                        contextBuilder.append(content.getContentText()).append("\n");
                    });
                });
            }
        }

        if (request.getAdditionalContext() != null && !request.getAdditionalContext().isBlank()) {
            contextBuilder.append("\n--- Ngữ cảnh bổ sung ---\n");
            contextBuilder.append(request.getAdditionalContext().trim()).append("\n");
        }

        // Lưu yêu cầu sinh câu hỏi với status PROCESSING
        QuestionGenerationRequest generationRequest = QuestionGenerationRequest.builder()
                .course(course)
                .requestedBy(requestedBy)
                .topic(request.getTopic().trim())
                .bloomLevel(request.getBloomLevel())
                .targetCount(request.getQuestionCount() != null ? request.getQuestionCount() : 5)
                .status("PROCESSING")
                .documents(selectedDocs)
                .build();
        generationRequest = generationRequestRepository.save(generationRequest);

        List<Question> savedQuestions = new ArrayList<>();

        try {
            String contextText = contextBuilder.toString();
            String aiResponseContent = callOpenAiForQuestions(course, request, contextText);
            savedQuestions = parseAndSaveQuestions(aiResponseContent, course, rubric, generationRequest, request.getBloomLevel());
            generationRequest.setStatus("COMPLETED");
        } catch (Exception e) {
            log.error("Lỗi khi sinh câu hỏi AI cho môn {}: {}", course.getCourseCode(), e.getMessage(), e);
            generationRequest.setStatus("FAILED");
        }

        generationRequestRepository.save(generationRequest);

        return buildResponse(generationRequest, savedQuestions);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuestionGenerationRequestResponse> getGenerationRequests(Long courseId, Long userId) {
        List<QuestionGenerationRequest> requests;
        if (courseId != null) {
            requests = generationRequestRepository.findByCourse_CourseId(courseId);
        } else if (userId != null) {
            requests = generationRequestRepository.findByRequestedBy_UserId(userId);
        } else {
            requests = generationRequestRepository.findAll();
        }

        return requests.stream()
                .map(req -> {
                    List<Question> questions = getQuestionsForRequest(req.getRequestId());
                    return buildResponse(req, questions);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public QuestionGenerationRequestResponse getGenerationRequestById(Long requestId) {
        QuestionGenerationRequest req = generationRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu sinh câu hỏi với ID: " + requestId));
        List<Question> questions = getQuestionsForRequest(requestId);
        return buildResponse(req, questions);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private String callOpenAiForQuestions(Course course, GenerateQuestionsRequest request, String contextText) {
        String bloomLabel = request.getBloomLevel() != null
                ? mapBloomToVietnamese(request.getBloomLevel())
                : "các mức độ REMEMBER, UNDERSTAND, APPLY, ANALYZE";

        String systemPrompt =
            "Bạn là chuyên gia giáo dục đại học chuyên tạo câu hỏi vấn đáp theo thang đo nhận thức Bloom. " +
            "Luôn trả lời bằng tiếng Việt. " +
            "Câu hỏi phải rõ ràng, súc tích, phù hợp với trình độ sinh viên đại học. " +
            "Trả về kết quả dưới dạng JSON object hợp lệ.";

        String contextSection = contextText.isBlank()
                ? "(Không có tài liệu đính kèm - hãy sinh câu hỏi dựa trên kiến thức chuyên môn)"
                : "Nội dung tài liệu:\n" + contextText;

        int count = request.getQuestionCount() != null ? request.getQuestionCount() : 5;
        String userPrompt = String.format(
            "Tạo %d câu hỏi vấn đáp cho môn học \"%s\" về chủ đề \"%s\".\n" +
            "Mức độ nhận thức Bloom yêu cầu: %s\n\n" +
            "%s\n\n" +
            "Trả về JSON theo đúng cấu trúc sau:\n" +
            "{\n" +
            "  \"questions\": [\n" +
            "    {\n" +
            "      \"questionText\": \"Nội dung câu hỏi\",\n" +
            "      \"sampleAnswer\": \"Gợi ý trả lời\",\n" +
            "      \"bloomLevel\": \"REMEMBER|UNDERSTAND|APPLY|ANALYZE\",\n" +
            "      \"difficulty\": 1,\n" +
            "      \"keywords\": \"từ khoá chấm điểm\"\n" +
            "    }\n" +
            "  ]\n" +
            "}",
            count,
            course.getCourseName(),
            request.getTopic(),
            bloomLabel,
            contextSection
        );

        return openAiClient.callChatCompletion(systemPrompt, userPrompt);
    }

    private List<Question> parseAndSaveQuestions(String aiContent, Course course, Rubric rubric,
                                                  QuestionGenerationRequest generationRequest,
                                                  BloomLevel defaultBloomLevel) {
        List<Question> result = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(aiContent);
            JsonNode questionsNode = root.path("questions");

            if (!questionsNode.isArray()) {
                log.warn("Phản hồi AI không chứa mảng 'questions'");
                return result;
            }

            for (JsonNode item : questionsNode) {
                String questionText = item.path("questionText").asText("").trim();
                if (questionText.isBlank()) continue;

                String sampleAnswer = item.path("sampleAnswer").asText(null);
                String bloomStr = item.path("bloomLevel").asText("");
                int difficulty = item.path("difficulty").asInt(1);

                BloomLevel bloomLevel = defaultBloomLevel;
                try {
                    if (!bloomStr.isBlank()) {
                        bloomLevel = BloomLevel.valueOf(bloomStr.toUpperCase());
                    }
                } catch (IllegalArgumentException ex) {
                    log.warn("Mức Bloom không hợp lệ từ AI: '{}', dùng mặc định", bloomStr);
                }

                Question question = Question.builder()
                        .course(course)
                        .rubric(rubric)
                        .generationRequest(generationRequest)
                        .questionText(questionText)
                        .sampleAnswer(sampleAnswer)
                        .bloomLevel(bloomLevel != null ? bloomLevel : BloomLevel.UNDERSTAND)
                        .difficulty((short) Math.max(1, Math.min(5, difficulty)))
                        .sourceType(QuestionSource.AI_GENERATED)
                        .status(QuestionStatus.PENDING_REVIEW)
                        .build();

                result.add(questionRepository.save(question));
            }
        } catch (Exception e) {
            log.error("Lỗi phân tích JSON từ AI: {}", e.getMessage(), e);
        }
        return result;
    }

    private List<Question> getQuestionsForRequest(Long requestId) {
        Specification<Question> spec = (root, query, cb) ->
                cb.equal(root.get("generationRequest").get("requestId"), requestId);
        return questionRepository.findAll(spec);
    }

    private QuestionGenerationRequestResponse buildResponse(QuestionGenerationRequest req, List<Question> questions) {
        List<QuestionResponse> questionResponses = questions.stream()
                .map(this::mapQuestionToResponse)
                .collect(Collectors.toList());

        return QuestionGenerationRequestResponse.builder()
                .requestId(req.getRequestId())
                .courseId(req.getCourse() != null ? req.getCourse().getCourseId() : null)
                .courseCode(req.getCourse() != null ? req.getCourse().getCourseCode() : null)
                .courseName(req.getCourse() != null ? req.getCourse().getCourseName() : null)
                .requestedByUserId(req.getRequestedBy() != null ? req.getRequestedBy().getUserId() : null)
                .requestedByName(req.getRequestedBy() != null ? req.getRequestedBy().getFullName() : null)
                .topic(req.getTopic())
                .bloomLevel(req.getBloomLevel())
                .targetCount(req.getTargetCount())
                .status(req.getStatus())
                .generatedQuestions(questionResponses)
                .createdAt(req.getCreatedAt())
                .build();
    }

    private QuestionResponse mapQuestionToResponse(Question q) {
        return QuestionResponse.builder()
                .id(q.getQuestionId())
                .courseId(q.getCourse() != null ? q.getCourse().getCourseId() : null)
                .courseCode(q.getCourse() != null ? q.getCourse().getCourseCode() : null)
                .courseName(q.getCourse() != null ? q.getCourse().getCourseName() : null)
                .rubricId(q.getRubric() != null ? q.getRubric().getRubricId() : null)
                .rubricName(q.getRubric() != null ? q.getRubric().getName() : null)
                .questionText(q.getQuestionText())
                .sampleAnswer(q.getSampleAnswer())
                .bloomLevel(q.getBloomLevel())
                .difficulty(q.getDifficulty())
                .sourceType(q.getSourceType())
                .status(q.getStatus())
                .reviewedById(q.getReviewedBy() != null ? q.getReviewedBy().getUserId() : null)
                .reviewedByName(q.getReviewedBy() != null ? q.getReviewedBy().getFullName() : null)
                .reviewedAt(q.getReviewedAt())
                .createdAt(q.getCreatedAt())
                .build();
    }

    private String mapBloomToVietnamese(BloomLevel level) {
        return switch (level) {
            case REMEMBER -> "REMEMBER (Nhớ - tái hiện kiến thức)";
            case UNDERSTAND -> "UNDERSTAND (Hiểu - diễn giải, giải thích)";
            case APPLY -> "APPLY (Vận dụng - áp dụng vào tình huống)";
            case ANALYZE -> "ANALYZE (Phân tích - tách biệt, so sánh)";
            case EVALUATE -> "EVALUATE (Đánh giá - phán xét, lựa chọn)";
            case CREATE -> "CREATE (Sáng tạo - thiết kế, xây dựng mới)";
        };
    }
}
