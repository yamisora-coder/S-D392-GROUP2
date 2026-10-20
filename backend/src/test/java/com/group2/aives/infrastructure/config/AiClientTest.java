package com.group2.aives.infrastructure.config;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
class AiClientTest {
    private AiClient client(HttpServer server) {
        var client=new AiClient(new ObjectMapper());
        ReflectionTestUtils.setField(client,"key","test-key");
        ReflectionTestUtils.setField(client,"model","test-model");
        ReflectionTestUtils.setField(client,"base","http://127.0.0.1:"+server.getAddress().getPort());
        return client;
    }
    @Test void vivaFollowupFailsFastWithoutRetryingOverloadedProvider() throws Exception {
        var calls=new AtomicInteger();var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/chat/completions",exchange->{calls.incrementAndGet();exchange.getRequestBody().readAllBytes();exchange.sendResponseHeaders(503,0);exchange.close();});server.start();
        try {var error=assertThrows(ResponseStatusException.class,()->client(server).followup("Ask one question","Synthetic answer",new ObjectMapper().createObjectNode()));assertEquals(503,error.getStatusCode().value());assertEquals(1,calls.get());}finally{server.stop(0);}
    }
    @Test void persistedRuntimeSettingsApplyToTheNextRequestWithoutMutatingEnvironmentModel() throws Exception {
        var received=new java.util.concurrent.atomic.AtomicReference<String>();var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/chat/completions",exchange->{received.set(new String(exchange.getRequestBody().readAllBytes(),StandardCharsets.UTF_8));byte[] body="{\"choices\":[{\"message\":{\"content\":\"{\\\"ok\\\":true}\"}}]}".getBytes(StandardCharsets.UTF_8);exchange.sendResponseHeaders(200,body.length);exchange.getResponseBody().write(body);exchange.close();});server.start();
        try{var c=client(server);var settings=org.mockito.Mockito.mock(com.group2.aives.application.service.SystemSettingsService.class);org.mockito.Mockito.when(settings.get()).thenReturn(new com.group2.aives.application.service.SystemSettingsService.Options("configured-model",0.1,10,90,7));ReflectionTestUtils.setField(c,"settings",settings);assertTrue(c.complete("Return JSON","Synthetic").path("ok").asBoolean());var payload=new ObjectMapper().readTree(received.get());assertEquals("configured-model",payload.path("model").asText());assertEquals(0.1,payload.path("temperature").asDouble());assertEquals("test-model",ReflectionTestUtils.getField(c,"model"));}finally{server.stop(0);}
    }
    @Test void retriesTemporaryFailureAndReturnsParsedResult() throws Exception {
        var calls=new AtomicInteger();var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/chat/completions",exchange->{
            int status=calls.incrementAndGet()==1?503:200;
            byte[] body=(status==503?"{}":"{\"choices\":[{\"message\":{\"content\":\"{\\\"ok\\\":true}\"}}]}").getBytes(StandardCharsets.UTF_8);
            exchange.getRequestBody().readAllBytes();exchange.sendResponseHeaders(status,body.length);exchange.getResponseBody().write(body);exchange.close();
        });server.start();
        try{assertTrue(client(server).complete("Return JSON","test").path("ok").asBoolean());assertEquals(2,calls.get());}finally{server.stop(0);}
    }
    @Test void stopsAfterThreeAttemptsAndShowsFriendly503() throws Exception {
        var calls=new AtomicInteger();var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/chat/completions",exchange->{calls.incrementAndGet();exchange.getRequestBody().readAllBytes();exchange.sendResponseHeaders(503,0);exchange.close();});server.start();
        try{var error=assertThrows(ResponseStatusException.class,()->client(server).complete("Return JSON","test"));assertEquals(503,error.getStatusCode().value());assertEquals(3,calls.get());assertTrue(error.getReason().contains("3 lần"));}finally{server.stop(0);}
    }
    @Test void doesNotRetryAuthenticationFailures() throws Exception {
        var calls=new AtomicInteger();var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/chat/completions",exchange->{calls.incrementAndGet();exchange.getRequestBody().readAllBytes();exchange.sendResponseHeaders(401,0);exchange.close();});server.start();
        try{var error=assertThrows(ResponseStatusException.class,()->client(server).complete("Return JSON","test"));assertEquals(1,calls.get());assertTrue(error.getReason().contains("xác thực"));}finally{server.stop(0);}
    }
    @Test void slowProviderReturnsTimeoutInsteadOfHanging() throws Exception {
        var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/chat/completions",exchange->{try{exchange.getRequestBody().readAllBytes();Thread.sleep(1500);exchange.sendResponseHeaders(503,0);}catch(Exception ignored){}finally{exchange.close();}});server.start();
        try{var c=client(server);ReflectionTestUtils.setField(c,"requestTimeoutSeconds",1L);var error=assertThrows(ResponseStatusException.class,()->c.complete("Return JSON","test"));assertEquals(504,error.getStatusCode().value());assertTrue(error.getReason().contains("quá lâu"));}finally{server.stop(0);}
    }

    @Test void callsNativeGeminiWithHeaderAndIgnoresThoughtParts() throws Exception {
        var received=new java.util.concurrent.atomic.AtomicReference<String>();
        var auth=new java.util.concurrent.atomic.AtomicReference<String>();
        var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/v1beta/models/gemini-3.8-flash:generateContent",exchange->{
            received.set(new String(exchange.getRequestBody().readAllBytes(),StandardCharsets.UTF_8));auth.set(exchange.getRequestHeaders().getFirst("x-goog-api-key"));
            var body="{\"candidates\":[{\"finishReason\":\"STOP\",\"content\":{\"parts\":[{\"thought\":true,\"text\":\"private reasoning\"},{\"text\":\"{\\\"ok\\\":true}\"}]}}]}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200,body.length);exchange.getResponseBody().write(body);exchange.close();
        });server.start();
        try {
            var c=client(server);ReflectionTestUtils.setField(c,"protocol","gemini");ReflectionTestUtils.setField(c,"model","gemini-3.8-flash");
            assertTrue(c.complete("Return JSON","test").path("ok").asBoolean());assertEquals("test-key",auth.get());
            var payload=new ObjectMapper().readTree(received.get());assertEquals("LOW",payload.path("generationConfig").path("thinkingConfig").path("thinkingLevel").asText());
            assertEquals("application/json",payload.path("generationConfig").path("responseMimeType").asText());assertFalse(received.get().contains("test-key"));
        } finally {server.stop(0);}
    }
    @Test void diagnosticReportsProviderFailureOnceWithoutLeakingKey() throws Exception {
        var calls=new AtomicInteger();var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/chat/completions",exchange->{calls.incrementAndGet();exchange.getRequestBody().readAllBytes();exchange.sendResponseHeaders(503,0);exchange.close();});server.start();
        try {var result=client(server).check();assertEquals(false,result.get("ok"));assertEquals(503,result.get("status"));assertEquals(1,calls.get());assertEquals("test-model",result.get("model"));assertFalse(new ObjectMapper().writeValueAsString(result).contains("test-key"));}
        finally {server.stop(0);}
    }
    @Test void quotaFailureDoesNotRetry() throws Exception {
        var calls=new AtomicInteger();var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/chat/completions",exchange->{calls.incrementAndGet();exchange.getRequestBody().readAllBytes();exchange.sendResponseHeaders(429,0);exchange.close();});server.start();
        try {var error=assertThrows(ResponseStatusException.class,()->client(server).complete("Return JSON","test"));assertEquals(429,error.getStatusCode().value());assertEquals(1,calls.get());}finally{server.stop(0);}
    }

    @Test void nativeModelLookupFiltersUnsupportedModels() throws Exception {
        var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/v1beta/models",exchange->{
            byte[] body="{\"models\":[{\"name\":\"models/gemini-3.1-flash-lite\",\"supportedGenerationMethods\":[\"generateContent\"]},{\"name\":\"models/gemini-image\",\"supportedGenerationMethods\":[\"generateContent\"]},{\"name\":\"models/embedding\",\"supportedGenerationMethods\":[\"embedContent\"]}]}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200,body.length);exchange.getResponseBody().write(body);exchange.close();
        });server.start();
        try {var c=client(server);ReflectionTestUtils.setField(c,"protocol","gemini");assertEquals(java.util.List.of("gemini-3.1-flash-lite"),c.availableModels());}finally{server.stop(0);}
    }
    @Test void probingAlternateModelDoesNotChangeConfiguredModel() throws Exception {
        var observed=new java.util.ArrayList<String>();var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/chat/completions",exchange->{
            observed.add(new ObjectMapper().readTree(exchange.getRequestBody()).path("model").asText());
            byte[] body="{\"choices\":[{\"message\":{\"content\":\"{\\\"ok\\\":true}\"}}]}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200,body.length);exchange.getResponseBody().write(body);exchange.close();
        });server.start();
        try {var c=client(server);assertEquals(true,c.checkModel("alternate-model").get("ok"));assertEquals(true,c.check().get("ok"));assertEquals(java.util.List.of("alternate-model","test-model"),observed);}finally{server.stop(0);}
    }

    @Test void structuredGradingSchemaIsSentToGemini() throws Exception {
        var captured=new java.util.concurrent.atomic.AtomicReference<String>();var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/v1beta/models/gemini-3.1-flash-lite:generateContent",exchange->{
            captured.set(new String(exchange.getRequestBody().readAllBytes(),StandardCharsets.UTF_8));
            byte[] body="{\"candidates\":[{\"finishReason\":\"STOP\",\"content\":{\"parts\":[{\"text\":\"{\\\"questions\\\":{}}\"}]}}]}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200,body.length);exchange.getResponseBody().write(body);exchange.close();
        });server.start();
        try {var c=client(server);ReflectionTestUtils.setField(c,"protocol","gemini");ReflectionTestUtils.setField(c,"model","gemini-3.1-flash-lite");var mapper=new ObjectMapper();var schema=mapper.readTree("{\"type\":\"object\",\"properties\":{\"questions\":{\"type\":\"object\"}},\"required\":[\"questions\"]}");c.completeStructured("Grade","test",schema);assertEquals(schema,mapper.readTree(captured.get()).path("generationConfig").path("responseJsonSchema"));}finally{server.stop(0);}
    }
}
