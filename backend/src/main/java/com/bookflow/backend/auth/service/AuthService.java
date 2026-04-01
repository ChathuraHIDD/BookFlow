package com.bookflow.backend.auth.service;

import java.time.Instant;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.bookflow.backend.auth.dto.AuthResponse;
import com.bookflow.backend.auth.dto.LoginRequest;
import com.bookflow.backend.auth.dto.RegisterRequest;
import com.bookflow.backend.auth.dto.UserResponse;
import com.bookflow.backend.auth.model.CampusYear;
import com.bookflow.backend.auth.model.Center;
import com.bookflow.backend.auth.model.DegreeProgram;
import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.auth.model.UserRole;
import com.bookflow.backend.auth.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    public AuthResponse register(RegisterRequest request) {
        validateRegisterBasics(request);

        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        UserRole role = parseRole(request.role());

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(role);
        user.setCreatedAt(Instant.now());

        applyRoleSpecificFields(user, request, role);

        User saved = userRepository.save(user);
        String token = tokenService.generateToken(saved.getId(), saved.getRole());

        return new AuthResponse(token, UserResponse.from(saved));
    }

    public AuthResponse login(LoginRequest request) {
        if (request == null || isBlank(request.email()) || isBlank(request.password())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required");
        }

        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String token = tokenService.generateToken(user.getId(), user.getRole());
        return new AuthResponse(token, UserResponse.from(user));
    }

    public Optional<User> resolveUserFromToken(String token) {
        return tokenService.validate(token)
                .flatMap(payload -> userRepository.findById(payload.userId()));
    }

    private void validateRegisterBasics(RegisterRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        if (isBlank(request.fullName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Full name is required");
        }
        if (isBlank(request.email())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        if (isBlank(request.password())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }
        if (request.password().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters");
        }
        if (isBlank(request.role())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role is required");
        }
    }

    private void applyRoleSpecificFields(User user, RegisterRequest request, UserRole role) {
        switch (role) {
            case STUDENT -> {
                user.setTelephone(requireNonBlank(request.telephone(), "Telephone is required for students"));
                user.setCampusYear(parseCampusYear(request.campusYear()));
                user.setSemester(parseSemester(request.semester()));
                user.setCenter(parseCenter(request.center()));
                user.setDegreeProgram(parseDegreeProgram(request.degreeProgram()));
            }
            case STAFF_MEMBER -> {
                user.setTelephone(requireNonBlank(request.telephone(), "Telephone is required for staff members"));
                user.setCenter(parseCenter(request.center()));
                user.setDegreeProgram(parseDegreeProgram(request.degreeProgram()));
                user.setCampusYear(null);
                user.setSemester(null);
            }
            case LIBRARIAN, ADMIN -> {
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
                    "Invalid role. Allowed: student, librarian, admin, staff member");
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

    private String requireNonBlank(String value, String message) {
        if (isBlank(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
