package com.bookflow.backend.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.bookflow.backend.auth.model.UserRole;

@Service
public class TokenService {

    private final String secret;
    private final long expiryHours;

    public TokenService(
            @Value("${app.auth.secret:bookflow-dev-secret-change-me}") String secret,
            @Value("${app.auth.token-expiry-hours:24}") long expiryHours) {
        this.secret = secret;
        this.expiryHours = expiryHours;
    }

    public String generateToken(String userId, UserRole role) {
        long expiryMillis = Instant.now().plusSeconds(expiryHours * 3600).toEpochMilli();
        String rawPayload = String.join(":", userId, role.name(), String.valueOf(expiryMillis), UUID.randomUUID().toString());
        String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(rawPayload.getBytes(StandardCharsets.UTF_8));
        String signature = sign(payload);
        return payload + "." + signature;
    }

    public Optional<TokenPayload> validate(String token) {
        if (token == null || token.isBlank() || !token.contains(".")) {
            return Optional.empty();
        }

        String[] parts = token.split("\\.", 2);
        if (parts.length != 2) {
            return Optional.empty();
        }

        String payload = parts[0];
        String actualSignature = parts[1];
        String expectedSignature = sign(payload);

        if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8),
                actualSignature.getBytes(StandardCharsets.UTF_8))) {
            return Optional.empty();
        }

        String rawPayload;
        try {
            rawPayload = new String(Base64.getUrlDecoder().decode(payload), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }

        String[] payloadParts = rawPayload.split(":", 4);
        if (payloadParts.length < 3) {
            return Optional.empty();
        }

        long expiryMillis;
        try {
            expiryMillis = Long.parseLong(payloadParts[2]);
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }

        if (Instant.now().toEpochMilli() > expiryMillis) {
            return Optional.empty();
        }

        UserRole role;
        try {
            role = UserRole.fromValue(payloadParts[1]);
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }

        return Optional.of(new TokenPayload(payloadParts[0], role, expiryMillis));
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] signatureBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to generate auth token", ex);
        }
    }

    public record TokenPayload(String userId, UserRole role, long expiryMillis) {
    }
}
