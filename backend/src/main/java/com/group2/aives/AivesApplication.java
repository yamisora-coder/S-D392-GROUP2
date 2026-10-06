package com.group2.aives;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.group2.aives.domain.model")
@EnableJpaRepositories(basePackages = "com.group2.aives.application.port.out")
public class AivesApplication {

    public static void main(String[] args) {
        SpringApplication.run(AivesApplication.class, args);
    }
}
