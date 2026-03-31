package com.bookflow.backend.admin.controller;

import java.util.Comparator;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bookflow.backend.admin.dto.AdminDashboardSummaryResponse;
import com.bookflow.backend.auth.dto.UserResponse;
import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.auth.model.UserRole;
import com.bookflow.backend.auth.repository.UserRepository;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/dashboard")
    public AdminDashboardSummaryResponse dashboardSummary() {
        return new AdminDashboardSummaryResponse(
                userRepository.count(),
                userRepository.countByRole(UserRole.STUDENT),
                userRepository.countByRole(UserRole.STAFF_MEMBER),
                userRepository.countByRole(UserRole.LIBRARIAN),
                userRepository.countByRole(UserRole.ADMIN));
    }

    @GetMapping("/users")
    public List<UserResponse> users() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(UserResponse::from)
                .toList();
    }
}
