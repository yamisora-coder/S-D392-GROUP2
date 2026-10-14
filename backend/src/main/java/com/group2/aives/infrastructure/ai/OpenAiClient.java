package com.group2.aives.infrastructure.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class OpenAiClient {

    private static final String GEMINI_BASE_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    @Value("${ai.gemini.api-key:}")
    private String apiKey;

    @Value("${ai.gemini.model:gemini-2.0-flash}")
    private String model;

    @Value("${ai.gemini.max-tokens:3000}")
    private int maxTokens;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public OpenAiClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    /**
     * Gọi Google Gemini API và trả về nội dung phản hồi dạng text.
     * Yêu cầu phản hồi JSON bằng cách chỉ định responseMimeType.
     */
    public String callChatCompletion(String systemPrompt, String userPrompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException(
                "Gemini API key chưa được cấu hình. " +
                "Vui lòng thiết lập ai.gemini.api-key trong file .env."
            );
        }

        try {
            String url = String.format(GEMINI_BASE_URL, model, apiKey);

            Map<String, Object> requestBody = Map.of(
                "system_instruction", Map.of(
                    "parts", List.of(Map.of("text", systemPrompt))
                ),
                "contents", List.of(
                    Map.of("role", "user", "parts", List.of(Map.of("text", userPrompt)))
                ),
                "generationConfig", Map.of(
                    "temperature", 0.7,
                    "maxOutputTokens", maxTokens,
                    "responseMimeType", "application/json"
                )
            );

            String bodyJson = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(120))
                    .POST(HttpRequest.BodyPublishers.ofString(bodyJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Gemini API lỗi: status={}, body={}", response.statusCode(), response.body());
                throw new RuntimeException("Gemini API trả về lỗi HTTP " + response.statusCode());
            }

            JsonNode responseJson = objectMapper.readTree(response.body());
            String content = responseJson
                    .path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

            log.debug("Gemini response content: {}", content);
            return content;

        } catch (IOException e) {
            throw new RuntimeException("Lỗi kết nối tới Gemini API: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Yêu cầu tới Gemini API bị gián đoạn.", e);
        }
    }
}
