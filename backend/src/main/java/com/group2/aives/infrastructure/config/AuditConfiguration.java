package com.group2.aives.infrastructure.config;
import com.group2.aives.domain.model.*;import com.group2.aives.infrastructure.persistence.jpa.AuditEventJpaRepository;
import jakarta.servlet.http.*;import lombok.RequiredArgsConstructor;import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.*;import org.springframework.web.servlet.config.annotation.*;
@Configuration @RequiredArgsConstructor
public class AuditConfiguration implements WebMvcConfigurer {
 private final AuditEventJpaRepository events;
 @Override public void addInterceptors(InterceptorRegistry registry){registry.addInterceptor(new HandlerInterceptor(){
  @Override public void afterCompletion(HttpServletRequest req,HttpServletResponse res,Object handler,Exception error){
   String path=req.getRequestURI();if(!path.startsWith("/api/") || (req.getMethod().equals("GET")&&!path.contains("/transcript")&&!path.contains("/recordings/")))return;
   var actor=(User)req.getAttribute("actor");var event=new AuditEvent();event.setTimestamp(java.time.LocalDateTime.now());event.setActor(actor==null?"Anonymous":actor.getCode());event.setRole(actor==null?"ANONYMOUS":actor.getRole().name());event.setAction(req.getMethod());event.setTarget(path.substring(0,Math.min(255,path.length())));event.setIp(req.getRemoteAddr());event.setHttpStatus(res.getStatus());event.setStatus(res.getStatus()<400?"SUCCESS":"FAILED");events.save(event);
  }
 });}
}
