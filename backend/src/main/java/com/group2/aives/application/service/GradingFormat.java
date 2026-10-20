package com.group2.aives.application.service;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.*;
@Component @RequiredArgsConstructor
public class GradingFormat {
    private final ObjectMapper json;
    private Map<String,Object> object(Map<String,Object> properties) {
        return Map.of("type","object","properties",properties,"required",new ArrayList<>(properties.keySet()),"additionalProperties",false);
    }
    private String answerFor(JsonNode answers,String questionId) {
        for(var a:answers)if(a.path("questionId").asText().equals(questionId))return a.path("text").asText();return "";
    }
    private Map<String,String> evidenceOptions(String text) {
        Map<String,String> options=new LinkedHashMap<>();options.put("NONE","");
        List<String> fragments=new ArrayList<>();
        for(String sentence:text.split("(?<=[.!?;])\\s+|\\R+")) {
            sentence=sentence.trim();for(int start=0;start<sentence.length();start+=280){String part=sentence.substring(start,Math.min(start+280,sentence.length())).trim();if(!part.isBlank())fragments.add(part);}
        }
        int count=Math.min(24,fragments.size());
        for(int i=0;i<count;i++){int index=count==1?0:(int)Math.round(i*(fragments.size()-1.0)/(count-1));options.put("E"+(i+1),fragments.get(index));}
        return options;
    }
    public JsonNode schema(JsonNode snapshots,JsonNode answers) {
        Map<String,Object> questionFields=new LinkedHashMap<>();
        for(var q:snapshots) {
            Map<String,Object> criteria=new LinkedHashMap<>();
            for(var rubric:q.path("rubrics")) {
                Map<String,Object> fields=new LinkedHashMap<>();
                fields.put("score",Map.of("type","number","minimum",0,"maximum",rubric.path("maxScore").asDouble()));
                fields.put("evidenceId",Map.of("type","string","enum",new ArrayList<>(evidenceOptions(answerFor(answers,q.path("id").asText())).keySet()),"description","Select an evidenceChoices id for this question; NONE if there is no supporting evidence."));
                fields.put("explanation",Map.of("type","string","description","Brief Vietnamese justification of the score using this criterion."));
                criteria.put(rubric.path("id").asText(),object(fields));
            }
            questionFields.put(q.path("id").asText(),object(Map.of("criteria",object(criteria))));
        }
        return json.valueToTree(object(Map.of("questions",object(questionFields))));
    }
    public JsonNode input(JsonNode snapshots,JsonNode answers) {
        var out=json.createObjectNode();var list=out.putArray("questions");
        for(var q:snapshots) {
            var item=list.addObject();String id=q.path("id").asText();item.put("questionId",id);item.put("content",q.path("content").asText());item.put("referenceAnswer",q.path("sampleAnswer").asText());
            String text="";for(var a:answers)if(a.path("questionId").asText().equals(id))text=a.path("text").asText();item.put("studentAnswer",text);
            var evidence=item.putArray("evidenceChoices");for(var entry:evidenceOptions(text).entrySet())evidence.addObject().put("id",entry.getKey()).put("text",entry.getValue());
            var criteria=item.putArray("rubrics");
            for(var rubric:q.path("rubrics"))criteria.addObject().put("rubricId",rubric.path("id").asText()).put("criteriaName",rubric.path("criteriaName").asText()).put("maxScore",rubric.path("maxScore").asDouble()).put("description",rubric.path("description").asText());
        }
        return out;
    }
    public ObjectNode normalize(JsonNode response,JsonNode snapshots,JsonNode answers) {
        var values=response.path("questions");
        if(!values.isObject() || values.size()!=snapshots.size())throw new IllegalArgumentException("AI chưa trả đủ kết quả câu hỏi. Bài nộp vẫn được giữ nguyên.");
        var out=json.createObjectNode();var list=out.putArray("questions");
        for(var q:snapshots) {
            String id=q.path("id").asText();var marks=values.path(id).path("criteria");
            if(!marks.isObject() || marks.size()!=q.path("rubrics").size())throw new IllegalArgumentException("AI thiếu kết quả rubric. Bài nộp vẫn được giữ nguyên.");
            var item=list.addObject();item.put("questionId",id);var criteria=item.putArray("criteria");
            for(var rubric:q.path("rubrics")) {
                String rid=rubric.path("id").asText();var mark=marks.path(rid);
                if(!mark.isObject())throw new IllegalArgumentException("AI trả mã rubric không hợp lệ.");
                var criterion=criteria.addObject();criterion.put("rubricId",rid);criterion.set("score",mark.path("score"));String evidenceId=mark.path("evidenceId").asText();var options=evidenceOptions(answerFor(answers,id));
                if(!options.containsKey(evidenceId))throw new IllegalArgumentException("AI trả mã bằng chứng không hợp lệ.");
                criterion.put("evidence",options.get(evidenceId));criterion.put("evidenceId",evidenceId);criterion.set("explanation",mark.path("explanation"));
            }
        }
        return out;
    }
}
