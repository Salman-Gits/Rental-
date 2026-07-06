package com.electrorent.backend.controller;

import com.electrorent.backend.model.User;
import com.electrorent.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    // Seeding an initial admin account if the database table is empty
    @PostConstruct
    public void seedAdminAccount() {
        if (!userRepository.existsByUsername("admin")) {
            User defaultAdmin = User.builder()
                    .username("admin")
                    .password("admin123") // In production, use standard BCrypt hashing!
                    .role("Admin")
                    .fullName("Admin Overseer")
                    .email("admin@electrorent.com")
                    .build();
            userRepository.save(defaultAdmin);
            System.out.println(">>> SEED: Created default Admin console user [admin / admin123]");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required"));
        }

        Optional<User> userOpt = userRepository.findByUsername(username.trim());

        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            User user = userOpt.get();
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "role", user.getRole(),
                    "fullName", user.getFullName(),
                    "username", user.getUsername(),
                    "email", user.getEmail()
            ));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Authentication failed: invalid username or password credentials"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Operator username already exists"));
        }
        
        // Save the newly registered administrator or user
        User savedUser = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }
}
