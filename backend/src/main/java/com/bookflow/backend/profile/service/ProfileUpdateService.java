package com.bookflow.backend.profile.service;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.bookflow.backend.auth.dto.UserResponse;
import com.bookflow.backend.auth.model.CampusYear;
import com.bookflow.backend.auth.model.Center;
import com.bookflow.backend.auth.model.DegreeProgram;
import com.bookflow.backend.auth.model.User;
import com.bookflow.backend.auth.model.UserRole;
import com.bookflow.backend.auth.repository.UserRepository;
import com.bookflow.backend.notifications.service.NotificationService;
import com.bookflow.backend.profile.dto.ProfileUpdateRequestCreateRequest;
import com.bookflow.backend.profile.dto.ProfileUpdateRequestResponse;
import com.bookflow.backend.profile.dto.ProfileUpdateReviewRequest;
import com.bookflow.backend.profile.model.ProfileUpdateRequest;
import com.bookflow.backend.profile.model.ProfileUpdateStatus;
import com.bookflow.backend.profile.repository.ProfileUpdateRequestRepository;

@Service
public class ProfileUpdateService {

    private final ProfileUpdateRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ProfileUpdateService(
            ProfileUpdateRequestRepository requestRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public UserResponse currentProfile(User user) {
        User freshUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return UserResponse.from(freshUser);
    }

    public List<ProfileUpdateRequestResponse> myRequests(User user) {
        return requestRepository.findByUserIdOrderByRequestedAtDesc(user.getId()).stream()
                .map(request -> ProfileUpdateRequestResponse.from(request, user))
                .toList();
    }

    public ProfileUpdateRequestResponse submitRequest(User user, ProfileUpdateRequestCreateRequest request) {
        if (user.getRole() != UserRole.STUDENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students can submit profile update requests");
        }

        String requestedEmail = requireNonBlank(request.email(), "Email is required").toLowerCase();
        userRepository.findByEmailIgnoreCase(requestedEmail)
                .filter(existing -> !existing.getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
                });

        ProfileUpdateRequest profileRequest = new ProfileUpdateRequest();
        profileRequest.setUserId(user.getId());
        profileRequest.setFullName(requireNonBlank(request.fullName(), "Full name is required"));
        profileRequest.setEmail(requestedEmail);
        profileRequest.setTelephone(requireNonBlank(request.telephone(), "Telephone is required"));
        profileRequest.setCampusYear(parseCampusYear(request.campusYear()));
        profileRequest.setSemester(parseSemester(request.semester()));
        profileRequest.setCenter(parseCenter(request.center()));
        profileRequest.setDegreeProgram(parseDegreeProgram(request.degreeProgram()));
        profileRequest.setStatus(ProfileUpdateStatus.PENDING);
        profileRequest.setRequestedAt(Instant.now());

        ProfileUpdateRequest saved = requestRepository.save(profileRequest);
        notificationService.notifyProfileUpdateSubmitted(user, saved);
        return ProfileUpdateRequestResponse.from(saved, user);
    }

    public List<ProfileUpdateRequestResponse> pendingRequests() {
        return requestRepository.findByStatusOrderByRequestedAtDesc(ProfileUpdateStatus.PENDING).stream()
                .map(request -> ProfileUpdateRequestResponse.from(request, findUser(request.getUserId())))
                .toList();
    }

    public ProfileUpdateRequestResponse approve(String requestId, User adminUser, ProfileUpdateReviewRequest reviewRequest) {
        ProfileUpdateRequest profileRequest = requestRepository.findByIdAndStatus(requestId, ProfileUpdateStatus.PENDING)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pending request not found"));

        User user = userRepository.findById(profileRequest.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        userRepository.findByEmailIgnoreCase(profileRequest.getEmail())
            .filter(existing -> !existing.getId().equals(user.getId()))
            .ifPresent(existing -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
            });

        applyRequestToUser(user, profileRequest);
        userRepository.save(user);

        profileRequest.setStatus(ProfileUpdateStatus.APPROVED);
        profileRequest.setAdminNote(normalizeOptional(reviewRequest == null ? null : reviewRequest.adminNote()));
        profileRequest.setReviewedBy(adminUser.getId());
        profileRequest.setReviewedAt(Instant.now());
        requestRepository.save(profileRequest);

        notificationService.notifyProfileUpdateApproved(user, profileRequest);
        return ProfileUpdateRequestResponse.from(profileRequest, user);
    }

    public ProfileUpdateRequestResponse decline(String requestId, User adminUser, ProfileUpdateReviewRequest reviewRequest) {
        ProfileUpdateRequest profileRequest = requestRepository.findByIdAndStatus(requestId, ProfileUpdateStatus.PENDING)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pending request not found"));

        User user = userRepository.findById(profileRequest.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        profileRequest.setStatus(ProfileUpdateStatus.DECLINED);
        profileRequest.setAdminNote(normalizeOptional(reviewRequest == null ? null : reviewRequest.adminNote()));
        profileRequest.setReviewedBy(adminUser.getId());
        profileRequest.setReviewedAt(Instant.now());
        requestRepository.save(profileRequest);

        notificationService.notifyProfileUpdateDeclined(user, profileRequest);
        return ProfileUpdateRequestResponse.from(profileRequest, user);
    }

    private void applyRequestToUser(User user, ProfileUpdateRequest request) {
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setTelephone(request.getTelephone());
        user.setCampusYear(request.getCampusYear());
        user.setSemester(request.getSemester());
        user.setCenter(request.getCenter());
        user.setDegreeProgram(request.getDegreeProgram());
    }

    private User findUser(String userId) {
        return userRepository.findById(userId).orElse(null);
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
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
