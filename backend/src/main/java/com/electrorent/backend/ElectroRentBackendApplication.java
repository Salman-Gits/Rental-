package com.electrorent.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ElectroRentBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ElectroRentBackendApplication.class, args);
        System.out.println("================================================");
        System.out.println(" ELECTRORENT BACKEND CONSOLE BOOTED SUCCESSFULLY ");
        System.out.println(" Listening on: http://localhost:8080            ");
        System.out.println(" Connected database: MySQL schema [electrorent] ");
        System.out.println("================================================");
    }
}
