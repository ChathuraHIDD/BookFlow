package com.bookflow.backend.admin.controller;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.bookflow.backend.admin.dto.AdminDashboardSummaryResponse;
import com.bookflow.backend.admin.dto.AdminUserUpdateRequest;
import com.bookflow.backend.auth.dto.MessageResponse;
import com.bookflow.backend.auth.dto.UserResponse;
import com.bookflow.backend.auth.model.CampusYear;
import com.bookflow.backend.auth.model.Center;
import com.bookflow.backend.auth.model.DegreeProgram;
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
                userRepository.countByRole(UserRole.ADMIN));
    }

    @GetMapping("/users")
    public List<UserResponse> users(
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "email", required = false) String email) {
        UserRole roleFilter = isBlank(role) ? null : parseRole(role);

        String normalizedEmail = normalize(email);
        String normalizedQuery = normalize(query);

        return userRepository.findAll().stream()
            .filter(user -> roleFilter == null || user.getRole() == roleFilter)
                .filter(user -> normalizedEmail.isEmpty() || normalize(user.getEmail()).contains(normalizedEmail))
                .filter(user -> normalizedQuery.isEmpty()
                        || normalize(user.getEmail()).contains(normalizedQuery)
                        || normalize(user.getFullName()).contains(normalizedQuery))
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(UserResponse::from)
                .toList();
    }

    @PutMapping("/users/{id}")
    public UserResponse updateUser(@PathVariable("id") String id, @RequestBody AdminUserUpdateRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!isBlank(request.fullName())) {
            user.setFullName(request.fullName().trim());
        }

        if (!isBlank(request.email())) {
            String newEmail = request.email().trim().toLowerCase(Locale.ROOT);
            userRepository.findByEmailIgnoreCase(newEmail)
                    .filter(existing -> !existing.getId().equals(user.getId()))
                    .ifPresent(existing -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
                    });
            user.setEmail(newEmail);
        }

        UserRole role = user.getRole();
        if (!isBlank(request.role())) {
            role = parseRole(request.role());
            user.setRole(role);
        }

        applyRoleSpecificFields(user, request, role);
        User saved = userRepository.save(user);
        return UserResponse.from(saved);
    }

    @DeleteMapping("/users/{id}")
    public MessageResponse deleteUser(@PathVariable("id") String id, Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof User currentUser
                && id.equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot delete your own account");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        userRepository.delete(user);
        return new MessageResponse("User deleted successfully");
    }

    private void applyRoleSpecificFields(User user, AdminUserUpdateRequest request, UserRole role) {
        switch (role) {
            case STUDENT -> {
                user.setTelephone(resolveRequiredText(request.telephone(), user.getTelephone(),
                        "Telephone is required for students"));
                user.setCampusYear(parseCampusYear(resolveRequiredText(request.campusYear(),
                        user.getCampusYear() == null ? null : user.getCampusYear().name(),
                        "Campus year is required for students")));
                user.setSemester(parseSemester(resolveRequiredInteger(request.semester(), user.getSemester(),
                        "Semester is required for students")));
                user.setCenter(parseCenter(resolveRequiredText(request.center(),
                        user.getCenter() == null ? null : user.getCenter().name(),
                        "Center is required for students")));
                user.setDegreeProgram(parseDegreeProgram(resolveRequiredText(request.degreeProgram(),
                        user.getDegreeProgram() == null ? null : user.getDegreeProgram().name(),
                        "Degree program is required for students")));
            }
            case STAFF_MEMBER -> {
                user.setTelephone(resolveRequiredText(request.telephone(), user.getTelephone(),
                        "Telephone is required for staff members"));
                user.setCenter(parseCenter(resolveRequiredText(request.center(),
                        user.getCenter() == null ? null : user.getCenter().name(),
                        "Center is required for staff members")));
                user.setDegreeProgram(parseDegreeProgram(resolveRequiredText(request.degreeProgram(),
                        user.getDegreeProgram() == null ? null : user.getDegreeProgram().name(),
                        "Degree program is required for staff members")));
                user.setCampusYear(null);
                user.setSemester(null);
            }
            case LIBRARIAN, TECHNICIAN, ADMIN -> {
                user.setTelephone(null);
                user.setCampusYear(null);
                user.setSemester(null);
                user.setCenter(null);
                user.setDegreeProgram(null);
            }
        }
    }

    private UserRole parseRole(String rawRole) {
        try {
            return UserRole.fromValue(rawRole);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid role. Allowed: student, admin, staff member");
        }
    }

    private CampusYear parseCampusYear(String rawYear) {
        try {
            return CampusYear.fromValue(rawYear);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid campus year. Allowed: 1st, 2nd, 3rd, 4th");
        }
    }

    private Integer parseSemester(Integer semester) {
        if (semester == null || (semester != 1 && semester != 2)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Semester must be 1 or 2");
        }
        return semester;
    }

    private Center parseCenter(String rawCenter) {
        try {
            return Center.fromValue(rawCenter);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid center. Allowed: Colombo Center, Mathara Center, Jaffna Center");
        }
    }

    private DegreeProgram parseDegreeProgram(String rawDegree) {
        try {
            return DegreeProgram.fromValue(rawDegree);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid degree program. Allowed: IT, EN, ART, BS, LAW");
        }
    }

    private String resolveRequiredText(String incomingValue, String existingValue, String errorMessage) {
        String chosen = !isBlank(incomingValue) ? incomingValue.trim() : existingValue;
        if (isBlank(chosen)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        return chosen.trim();
    }

    private Integer resolveRequiredInteger(Integer incomingValue, Integer existingValue, String errorMessage) {
        Integer chosen = incomingValue != null ? incomingValue : existingValue;
        if (chosen == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        return chosen;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
