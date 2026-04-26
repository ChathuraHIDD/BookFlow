package com.bookflow.backend.auth.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GoogleIdTokenVerifierService {

    private static final String GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";

    private final String googleClientId;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GoogleIdTokenVerifierService(
            @Value("${app.auth.google.client-id:}") String googleClientId,
            ObjectMapper objectMapper) {
        this.googleClientId = googleClientId;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .build();
    }

    public GoogleIdentity verifyIdToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google ID token is required");
        }

        if (googleClientId == null || googleClientId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Google authentication is not configured on the server");
        }

        String encodedToken = URLEncoder.encode(idToken, StandardCharsets.UTF_8);
        HttpRequest request = HttpRequest.newBuilder(URI.create(GOOGLE_TOKEN_INFO_URL + "?id_token=" + encodedToken))
                .GET()
                .timeout(Duration.ofSeconds(8))
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to verify Google token");
        }

        if (response.statusCode() != 200) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
        }

        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(response.body(), new TypeReference<>() {
            });
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid response from Google token verifier");
        }

        String audience = asString(payload.get("aud"));
        if (!googleClientId.equals(audience)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token audience does not match client id");
        }

        String issuer = asString(payload.get("iss"));
        if (!"accounts.google.com".equals(issuer) && !"https://accounts.google.com".equals(issuer)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token issuer");
        }

        if (!asBoolean(payload.get("email_verified"))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google account email is not verified");
        }

        String subject = asString(payload.get("sub"));
        String email = asString(payload.get("email")).toLowerCase();
        String name = asString(payload.get("name"));

        if (subject.isBlank() || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token is missing required identity fields");
        }

        return new GoogleIdentity(subject, email, name);
    }

    private String asString(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private boolean asBoolean(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        return "true".equalsIgnoreCase(asString(value));
    }

    public record GoogleIdentity(String subject, String email, String name) {
    }
}
