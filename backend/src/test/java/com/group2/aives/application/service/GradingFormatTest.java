package com.group2.aives.application.service;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class GradingFormatTest {
    private final ObjectMapper json=new ObjectMapper();private final GradingFormat format=new GradingFormat(json);
    private ArrayNode questions() {
        var qs=json.createArrayNode();
        for(int i=1;i<=3;i++){var q=qs.addObject();q.put("id","q"+i);q.put("content","Question "+i);var rubrics=q.putArray("rubrics");for(int j=1;j<=i;j++)rubrics.addObject().put("id","r"+i+j).put("criteriaName","Criterion").put("maxScore",10.0/i).put("description","Score bands");}
        return qs;
    }
    private ArrayNode answers() {var answers=json.createArrayNode();for(int i=1;i<=3;i++)answers.addObject().put("questionId","q"+i).put("text","answer");return answers;}
    private ObjectNode response(JsonNode qs) {
        var response=json.createObjectNode();var values=response.putObject("questions");
        for(var q:qs){var criteria=values.putObject(q.path("id").asText()).putObject("criteria");for(var r:q.path("rubrics"))criteria.putObject(r.path("id").asText()).put("score",1).put("evidenceId","E1").put("explanation","Reason");}return response;
    }
    @Test void schemaRequiresEveryQuestionAndEveryCriterion() {
        var schema=format.schema(questions(),answers());var qs=schema.path("properties").path("questions");assertEquals(3,qs.path("required").size());
        assertEquals(3,qs.path("properties").path("q3").path("properties").path("criteria").path("required").size());
        assertEquals(10.0/3,qs.path("properties").path("q3").path("properties").path("criteria").path("properties").path("r31").path("properties").path("score").path("maximum").asDouble());
    }
    @Test void normalizesThreeQuestionsWithDifferentRubricCounts() {
        var qs=questions();var result=format.normalize(response(qs),qs,answers());assertEquals(3,result.path("questions").size());
        for(int i=0;i<3;i++){var q=result.path("questions").get(i);assertEquals("q"+(i+1),q.path("questionId").asText());assertEquals(i+1,q.path("criteria").size());}
    }
    @Test void missingQuestionOrCriterionFailsWithoutInventingScores() {
        var qs=questions();var missing=response(qs);((ObjectNode)missing.path("questions")).remove("q2");assertThrows(IllegalArgumentException.class,()->format.normalize(missing,qs,answers()));
        var noRubric=response(qs);((ObjectNode)noRubric.path("questions").path("q3").path("criteria")).remove("r32");assertThrows(IllegalArgumentException.class,()->format.normalize(noRubric,qs,answers()));
    }
    @Test void inputMatchesAnswersByIdAndIncludesUnansweredQuestions() {
        var qs=questions();var answers=json.createArrayNode();answers.addObject().put("questionId","q2").put("text","answer two");var input=format.input(qs,answers);
        assertEquals(3,input.path("questions").size());assertEquals("",input.path("questions").get(0).path("studentAnswer").asText());assertEquals("answer two",input.path("questions").get(1).path("studentAnswer").asText());
    }

    @Test void resolvesEvidenceToOriginalAnswerAndRejectsUnknownIds() {
        var qs=questions();var wire=response(qs);var normalized=format.normalize(wire,qs,answers());
        assertEquals("answer",normalized.path("questions").get(0).path("criteria").get(0).path("evidence").asText());
        ((ObjectNode)wire.path("questions").path("q1").path("criteria").path("r11")).put("evidenceId","INVENTED");assertThrows(IllegalArgumentException.class,()->format.normalize(wire,qs,answers()));
    }
}
