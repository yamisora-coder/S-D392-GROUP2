package com.group2.aives.infrastructure.security;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
@Component
public class TokenService {
    private record Credential(UUID userId, Instant expires) {}
    private final Map<String, Credential> tokens = new ConcurrentHashMap<>();
    public String issue(UUID id) {
        tokens.entrySet().removeIf(e -> e.getValue().expires().isBefore(Instant.now()));
        String token = UUID.randomUUID().toString() + UUID.randomUUID();
        tokens.put(token, new Credential(id, Instant.now().plusSeconds(28800))); return token;
    }
    public Optional<UUID> resolve(String token) {
        Credential c=tokens.get(token);
        if(c==null) return Optional.empty();
        if(c.expires().isBefore(Instant.now())) {tokens.remove(token); return Optional.empty();}
        return Optional.of(c.userId());
    }
    public void revoke(String token) { tokens.remove(token); }
}
