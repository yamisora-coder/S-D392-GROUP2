package com.group2.aives.application.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class GenerationContextTest {
    private final GenerationContext context=new GenerationContext();private final ObjectMapper json=new ObjectMapper();
    @Test void limitsPromptAndPreservesSourcePages() {
        var chunks=json.createArrayNode();for(int i=1;i<=12;i++)chunks.addObject().put("page",i).put("text","a".repeat(2000));
        var selected=context.select(chunks,3);int size=0;for(var c:selected)size+=c.path("text").asText().length();
        assertEquals(12000,size);assertEquals(3,selected.get(0).path("page").asInt());assertEquals(8,selected.get(selected.size()-1).path("page").asInt());
    }
    @Test void rejectsPageOutsideExtractedText() {
        var chunks=json.createArrayNode();chunks.addObject().put("page",1).put("text","source text");assertThrows(IllegalArgumentException.class,()->context.select(chunks,10));
    }
    @Test void rejectsEmptyScannedDocument() {assertThrows(IllegalArgumentException.class,()->context.select(json.createArrayNode(),1));}
}
