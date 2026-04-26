package com.bookflow.backend.auth.config;

import java.time.Instant;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.auth.model.UserRole;
import com.bookflow.backend.auth.repository.UserRepository;

@Configuration
public class AuthSeedConfig {

    @Bean
    ApplicationRunner seedDefaultTechnician(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String email = "technician@test.com";
            if (userRepository.existsByEmailIgnoreCase(email)) {
                return;
            }

            User technician = new User();
            technician.setFullName("Default Technician");
            technician.setEmail(email);
            technician.setPasswordHash(passwordEncoder.encode("123456"));
            technician.setRole(UserRole.TECHNICIAN);
            technician.setTelephone("0700000000");
            technician.setCreatedAt(Instant.now());
            userRepository.save(technician);
        };
    }
}