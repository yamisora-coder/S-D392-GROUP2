package com.group2.aives.application.service;
import com.fasterxml.jackson.databind.*;import com.fasterxml.jackson.databind.node.*;import com.group2.aives.domain.model.CourseMaterial;import com.group2.aives.infrastructure.persistence.jpa.MaterialJpaRepository;import lombok.RequiredArgsConstructor;import org.springframework.stereotype.Service;import java.util.*;import java.text.Normalizer;
@Service @RequiredArgsConstructor
public class MaterialRetrieval {
 private final ObjectMapper json;private final MaterialJpaRepository materials;
 private static final Set<String> STOP=Set.of("the","a","an","and","or","is","are","to","of","in","for","with","that","this","be","as","on","by","it","la","va","cua","cac","nhung","mot","trong","de","cho","hay","ve","theo");
 private String normalize(String value){return Normalizer.normalize(value.toLowerCase(Locale.ROOT),Normalizer.Form.NFD).replaceAll("\\p{M}","").replace('đ','d');}
 private Map<String,Integer> terms(String text){Map<String,Integer> result=new HashMap<>();for(String token:normalize(text).split("[^a-z0-9]+"))if(token.length()>1&&!STOP.contains(token))result.merge(token,1,Integer::sum);return result;}
 public String index(JsonNode chunks) throws Exception {
  var out=json.createArrayNode();for(var chunk:chunks){var counts=terms(chunk.path("text").asText());var row=out.addObject();row.set("terms",json.valueToTree(counts));row.put("length",counts.values().stream().mapToInt(Integer::intValue).sum());}return json.writeValueAsString(out);
 }
 public ArrayNode search(CourseMaterial material,String query,Integer startPage,int limit) throws Exception {
  if(query==null||query.isBlank())throw new IllegalArgumentException("Nhập chủ đề cần tìm");if(query.length()>1000)throw new IllegalArgumentException("Chủ đề tối đa 1000 ký tự");
  var chunks=json.readTree(material.getChunksJson());if(material.getSearchIndexJson()==null){material.setSearchIndexJson(index(chunks));materials.save(material);}var index=json.readTree(material.getSearchIndexJson());
  String expanded=query;String normalized=normalize(query);if(normalized.contains("phu thuoc"))expanded+=" dependency injection";if(normalized.contains("kien truc"))expanded+=" architecture";if(normalized.contains("kiem thu"))expanded+=" testing tests unit";
  var queryTerms=terms(expanded).keySet();int n=chunks.size();double avg=0;for(var row:index)avg+=row.path("length").asInt();avg=Math.max(1,avg/Math.max(1,n));
  Map<String,Integer> frequencies=new HashMap<>();for(String term:queryTerms){int df=0;for(var row:index)if(row.path("terms").has(term))df++;frequencies.put(term,df);}
  record Hit(int index,double score){}List<Hit> hits=new ArrayList<>();
  for(int i=0;i<n;i++){if(chunks.get(i).path("page").asInt()<(startPage==null?1:startPage))continue;var row=index.get(i);double score=0;
   for(String term:queryTerms){double tf=row.path("terms").path(term).asDouble();if(tf==0)continue;double idf=Math.log(1+(n-frequencies.get(term)+0.5)/(frequencies.get(term)+0.5));score+=idf*(tf*2.2)/(tf+1.2*(0.25+0.75*row.path("length").asInt()/avg));}
   if(score>0)hits.add(new Hit(i,score));
  }
  hits.sort(Comparator.comparingDouble(Hit::score).reversed().thenComparingInt(Hit::index));var selected=json.createArrayNode();int budget=12000;
  for(var hit:hits.subList(0,Math.min(Math.max(1,Math.min(6,limit)),hits.size()))){var chunk=chunks.get(hit.index());String text=chunk.path("text").asText();text=text.substring(0,Math.min(budget,text.length()));budget-=text.length();selected.addObject().put("page",chunk.path("page").asInt()).put("text",text).put("score",Math.round(hit.score()*1000)/1000.0).put("materialId",material.getId().toString()).put("filename",material.getFilename());if(budget<=0)break;}
  if(selected.isEmpty())throw new IllegalArgumentException("Không tìm thấy đoạn liên quan. Thử từ khóa trong tài liệu hoặc đổi trang bắt đầu.");return selected;
 }
}
