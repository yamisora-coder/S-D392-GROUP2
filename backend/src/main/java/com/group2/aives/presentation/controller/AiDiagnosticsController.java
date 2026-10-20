package com.group2.aives.presentation.controller;
import com.group2.aives.infrastructure.config.AiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequiredArgsConstructor
public class AiDiagnosticsController {
    private final AiClient ai;
    @GetMapping("/api/ai/models") public java.util.List<String> models(){return ai.availableModels();}
    @PostMapping("/api/ai/check") public Map<String,Object> check(@RequestParam(required=false) String model){return model==null?ai.check():ai.checkModel(model);}
}
