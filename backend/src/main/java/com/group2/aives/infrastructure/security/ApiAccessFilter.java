package com.group2.aives.infrastructure.security;
import com.group2.aives.domain.model.User;
import com.group2.aives.domain.model.enums.Role;
import com.group2.aives.domain.repository.UserRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
@Component
@RequiredArgsConstructor
public class ApiAccessFilter extends OncePerRequestFilter {
    private final TokenService tokens;
    private final UserRepository users;
    private final com.group2.aives.infrastructure.persistence.jpa.AuditEventJpaRepository audit;
    @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        String p=req.getRequestURI(), m=req.getMethod();
        if(!p.startsWith("/api/") || m.equals("OPTIONS") ||
           (m.equals("POST") && (p.equals("/api/auth/login") || p.equals("/api/auth/register") || p.equals("/api/users/register")))) {
            chain.doFilter(req,res); return;
        }
        String header=req.getHeader("Authorization");
        User user=header!=null && header.startsWith("Bearer ") ? tokens.resolve(header.substring(7)).flatMap(users::findById).orElse(null) : null;
        if(user==null || !user.isAccountActive()) {deny(req,res,401); return;}
        req.setAttribute("actor",user);
        if(p.startsWith("/api/auth/")) {chain.doFilter(req,res); return;}
        if((p.startsWith("/api/admin/") || p.startsWith("/api/users")) && user.getRole()!=Role.ADMIN) {deny(req,res,403); return;}
        if(user.getRole()==Role.STUDENT) {
            boolean allowed=m.equals("GET") && (p.equals("/api/runtime-options") || p.equals("/api/exams") || p.equals("/api/subjects") || p.equals("/api/sessions/student/"+user.getId()));
            allowed |= p.matches("/api/sessions/[^/]+/(start|answers|ai-grade|attempt|responses|follow-up|question|transcript|recording-consent|recordings)") && (m.equals("POST") || m.equals("GET") || (m.equals("DELETE")&&p.endsWith("/recordings")));
            allowed |= m.equals("GET") && p.matches("/api/sessions/[^/]+/recordings/[0-9]+");
            if(!allowed) {deny(req,res,403);return;}
        }
        chain.doFilter(req,res);
    }
    private void deny(HttpServletRequest req,HttpServletResponse res,int status) throws IOException {
        var actor=(User)req.getAttribute("actor");var event=new com.group2.aives.domain.model.AuditEvent();event.setTimestamp(java.time.LocalDateTime.now());event.setActor(actor==null?"Anonymous":actor.getCode());event.setRole(actor==null?"ANONYMOUS":actor.getRole().name());event.setAction(req.getMethod());event.setTarget(req.getRequestURI().substring(0,Math.min(255,req.getRequestURI().length())));event.setIp(req.getRemoteAddr());event.setHttpStatus(status);event.setStatus("FAILED");audit.save(event);
        res.setStatus(status);res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"message\":\""+(status==401?"Vui lòng đăng nhập lại":"Bạn không có quyền thực hiện thao tác này")+"\"}");
    }
}
