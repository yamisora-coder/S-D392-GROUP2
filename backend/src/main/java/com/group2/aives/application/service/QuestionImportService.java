package com.group2.aives.application.service;
import com.group2.aives.application.dto.request.*;
import com.group2.aives.application.dto.response.QuestionResponse;
import com.group2.aives.domain.model.enums.*;
import com.group2.aives.infrastructure.persistence.jpa.ChapterJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.commons.csv.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
@Service @RequiredArgsConstructor
public class QuestionImportService {
    private final QuestionService questions;private final ChapterJpaRepository chapters;
    @Transactional public List<QuestionResponse> upload(MultipartFile file) throws Exception {
        if(file.isEmpty() || file.getSize()>20*1024*1024)throw new IllegalArgumentException("File phải từ 1 byte đến 20MB");
        String name=Objects.requireNonNullElse(file.getOriginalFilename(),"").toLowerCase();
        List<Map<String,String>> rows=new ArrayList<>();
        if(name.endsWith(".csv")) {
            String text=new String(file.getBytes(),StandardCharsets.UTF_8).replaceFirst("^\uFEFF","");
            try(var parser=CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setIgnoreEmptyLines(true).build().parse(new StringReader(text))) {
                for(var row:parser){rows.add(row.toMap());if(rows.size()>5000)throw new IllegalArgumentException("Tối đa 5000 dòng");}
            }
        } else if(name.endsWith(".xlsx")) {
            try(var book=new XSSFWorkbook(file.getInputStream())) {
                var sheet=book.getSheetAt(0);var fmt=new DataFormatter();var header=sheet.getRow(0);
                if(header==null)throw new IllegalArgumentException("Thiếu header");
                if(sheet.getLastRowNum()>5000)throw new IllegalArgumentException("Tối đa 5000 dòng");
                for(int i=1;i<=sheet.getLastRowNum();i++) {
                    var row=sheet.getRow(i);if(row==null)continue;Map<String,String> values=new LinkedHashMap<>();
                    for(int col=0;col<header.getLastCellNum();col++)values.put(fmt.formatCellValue(header.getCell(col)).trim(),fmt.formatCellValue(row.getCell(col)).trim());
                    if(values.values().stream().anyMatch(v->!v.isBlank()))rows.add(values);
                }
            }
        } else throw new IllegalArgumentException("Chỉ hỗ trợ CSV và XLSX");
        if(rows.isEmpty())throw new IllegalArgumentException("File không có câu hỏi");
        Map<String,QuestionRequest> grouped=new LinkedHashMap<>();int line=1;
        for(var row:rows) {
            line++;
            try {
                String code=required(row,"question_code");UUID chapterId=UUID.fromString(required(row,"chapter_id"));
                var chapter=chapters.findById(chapterId).orElseThrow(()->new IllegalArgumentException("Chương không tồn tại"));
                String content=required(row,"content");BloomLevel bloom=BloomLevel.valueOf(required(row,"bloom").toUpperCase());Difficulty difficulty=Difficulty.valueOf(required(row,"difficulty").toUpperCase());
                var q=grouped.get(code);
                if(q==null){q=QuestionRequest.builder().subjectId(chapter.getSubjectId()).chapterId(chapterId).content(content).bloomLevel(bloom).difficulty(difficulty).sampleAnswer(row.get("sample_answer")).status(QuestionStatus.DRAFT).build();grouped.put(code,q);}
                else if(!q.getChapterId().equals(chapterId) || !q.getContent().equals(content) || q.getBloomLevel()!=bloom || q.getDifficulty()!=difficulty || !Objects.equals(q.getSampleAnswer(),row.get("sample_answer")))throw new IllegalArgumentException("Các dòng cùng mã phải có cùng nội dung câu hỏi");
                double max=Double.parseDouble(required(row,"max_score"));if(!Double.isFinite(max)||max<=0)throw new IllegalArgumentException("Điểm phải dương");
                q.getRubrics().add(RubricRequest.builder().criteriaName(required(row,"rubric_name")).description(required(row,"scoring_description")).maxScore(max).build());
            } catch(Exception e){throw new IllegalArgumentException("Dòng "+line+": "+e.getMessage());}
        }
        for(var entry:grouped.entrySet())if(Math.abs(entry.getValue().getRubrics().stream().mapToDouble(RubricRequest::getMaxScore).sum()-10)>0.001)throw new IllegalArgumentException("Câu "+entry.getKey()+": tổng rubric phải bằng 10");
        return grouped.values().stream().map(questions::createQuestion).toList();
    }
    private String required(Map<String,String> row,String key){String v=row.get(key);if(v==null||v.isBlank())throw new IllegalArgumentException("Thiếu "+key);return v.trim();}
}
