package com.group2.aives.application.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group2.aives.domain.model.CourseMaterial;
import com.group2.aives.infrastructure.persistence.jpa.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import java.time.LocalDateTime;
import java.util.*;
@Service @RequiredArgsConstructor
public class MaterialService {
    private final ChapterJpaRepository chapters;private final MaterialJpaRepository materials;private final ObjectMapper json;private final MaterialRetrieval retrieval;
    @org.springframework.transaction.annotation.Transactional(rollbackFor=Exception.class)
    public CourseMaterial upload(UUID chapterId, MultipartFile file) throws Exception {
        if(!chapters.existsById(chapterId)) throw new IllegalArgumentException("Chương không tồn tại");
        if(file.isEmpty() || file.getSize()>20*1024*1024) throw new IllegalArgumentException("File phải từ 1 byte đến 20MB");
        String name=Objects.requireNonNullElse(file.getOriginalFilename(),"file");
        List<Map<String,Object>> chunks=new ArrayList<>();
        if(name.toLowerCase().endsWith(".pdf")) {
            try(var doc=Loader.loadPDF(file.getBytes())) {
                if(doc.getNumberOfPages()>500) throw new IllegalArgumentException("Tối đa 500 trang mỗi tài liệu");
                var stripper=new PDFTextStripper();
                for(int i=1;i<=doc.getNumberOfPages();i++){stripper.setStartPage(i);stripper.setEndPage(i);chunk(chunks,i,stripper.getText(doc));}
            }
        } else if(name.toLowerCase().endsWith(".pptx")) {
            try(var slides=new XMLSlideShow(file.getInputStream())) {
                int page=0;for(var slide:slides.getSlides()) {StringBuilder text=new StringBuilder();for(var shape:slide.getShapes()) if(shape instanceof XSLFTextShape t) text.append(t.getText()).append("\n");chunk(chunks,++page,text.toString());}
            }
        } else if(name.toLowerCase().endsWith(".txt")) chunk(chunks,1,new String(file.getBytes(),java.nio.charset.StandardCharsets.UTF_8));
        else throw new IllegalArgumentException("Chỉ hỗ trợ PDF, PPTX, TXT");
        if(chunks.isEmpty()) throw new IllegalArgumentException("Không tìm thấy văn bản. PDF scan cần OCR trước khi upload");
        CourseMaterial material=new CourseMaterial();material.setChapterId(chapterId);material.setFilename(name);
        material.setUploadedAt(LocalDateTime.now());material.setChunksJson(json.writeValueAsString(chunks));material.setSearchIndexJson(retrieval.index(json.valueToTree(chunks)));return materials.save(material);
    }
    private void chunk(List<Map<String,Object>> chunks,int page,String text) {
        text=text.trim();for(int start=0;start<text.length();start+=1800) {
            if(chunks.size()>=2000) throw new IllegalArgumentException("Tài liệu quá lớn, hãy tách theo chương nhỏ hơn");
            chunks.add(Map.of("page",page,"text",text.substring(start,Math.min(start+2000,text.length()))));
        }
    }
}
