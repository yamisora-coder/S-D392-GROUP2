package com.group2.aives.presentation.controller;
import com.group2.aives.application.service.QuestionImportService;
import com.group2.aives.application.dto.response.QuestionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
@RestController @RequiredArgsConstructor
public class QuestionImportController {
    private final QuestionImportService importer;
    @PostMapping("/api/questions/import") public List<QuestionResponse> upload(@RequestParam MultipartFile file) throws Exception {return importer.upload(file);}
}
