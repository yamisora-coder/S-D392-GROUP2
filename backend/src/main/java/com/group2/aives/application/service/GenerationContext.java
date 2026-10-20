package com.group2.aives.application.service;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.springframework.stereotype.Component;
@Component
public class GenerationContext {
    public ArrayNode select(JsonNode chunks,Integer startPage) {
        if(!chunks.isArray())throw new IllegalArgumentException("Tài liệu chưa có văn bản hợp lệ. Vui lòng upload lại.");
        var selected=JsonNodeFactory.instance.arrayNode();int remaining=12000;
        for(var chunk:chunks) {
            int page=chunk.path("page").asInt();String text=chunk.path("text").asText().trim();
            if(page<(startPage==null?1:startPage) || text.isBlank())continue;
            if(remaining<=0)break;
            String excerpt=text.substring(0,Math.min(remaining,text.length()));
            selected.addObject().put("page",page).put("text",excerpt);remaining-=excerpt.length();
        }
        if(selected.isEmpty())throw new IllegalArgumentException("Không có văn bản ở phạm vi trang đã chọn. Chọn trang trước đó hoặc dùng PDF có chữ.");
        return selected;
    }
    public String bloomGuidance(com.group2.aives.domain.model.enums.BloomLevel bloom) {
        return switch(bloom) {
            case REMEMBER -> "Bloom 1: ask to recall, define, identify or list facts explicitly present in the source. Do not ask for analysis.";
            case UNDERSTAND -> "Bloom 2: ask to explain in the student's own words, summarize, classify or illustrate a concept.";
            case APPLY -> "Bloom 3: ask to apply a source concept to a concrete new scenario.";
            case ANALYZE -> "Bloom 4: ask to analyze relationships, distinguish responsibilities or compare architectural tradeoffs.";
            case EVALUATE -> "Bloom 5: ask to judge or justify a choice using explicit criteria and evidence from source concepts.";
            case CREATE -> "Bloom 6: ask to propose or design an original solution combining source concepts, with stated constraints.";
        };
    }
}
