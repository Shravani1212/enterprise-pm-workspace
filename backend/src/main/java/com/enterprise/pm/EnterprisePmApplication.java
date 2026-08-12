package com.enterprise.pm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EnterprisePmApplication {

    public static void main(String[] args) {
        SpringApplication.run(EnterprisePmApplication.class, args);
    }
}
