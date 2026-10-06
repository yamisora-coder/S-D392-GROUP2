package com.group2.aives.presentation.controller;

import com.group2.aives.application.dto.request.RubricRequest;
import com.group2.aives.application.dto.response.RubricResponse;
import com.group2.aives.application.port.in.RubricService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rubrics")
@RequiredArgsConstructor
@Tag(name = "2b. Barem điểm (Rubrics)", description = "CRUD Barem điểm & Tiêu chí chấm thi độc lập")
@CrossOrigin(origins = "*")
public class RubricController {

    private final RubricService rubricService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả bộ rubric")
    public ResponseEntity<List<RubricResponse>> getAllRubrics() {
        return ResponseEntity.ok(rubricService.getAllRubrics());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết một bộ rubric kèm danh sách tiêu chí")
    public ResponseEntity<RubricResponse> getRubricById(@PathVariable Long id) {
        return ResponseEntity.ok(rubricService.getRubricById(id));
    }

    @PostMapping
    @Operation(summary = "Tạo bộ rubric mới kèm danh sách tiêu chí con")
    public ResponseEntity<RubricResponse> createRubric(@Valid @RequestBody RubricRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(rubricService.createRubric(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật bộ rubric và tiêu chí")
    public ResponseEntity<RubricResponse> updateRubric(@PathVariable Long id, @Valid @RequestBody RubricRequest request) {
        return ResponseEntity.ok(rubricService.updateRubric(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa bộ rubric")
    public ResponseEntity<Void> deleteRubric(@PathVariable Long id) {
        rubricService.deleteRubric(id);
        return ResponseEntity.noContent().build();
    }
}
