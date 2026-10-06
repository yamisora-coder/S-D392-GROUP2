package com.group2.aives.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AIVES API - AI-powered Viva Exam System")
                        .version("1.0.0")
                        .description("Tài liệu API RESTful cho hệ thống phỏng vấn / thi vấn đáp AI (AIVES). Nhóm SD392 - Group 2.")
                        .contact(new Contact()
                                .name("SD392 Group 2 Team")
                                .email("group2@fpt.edu.vn")));
    }
}
