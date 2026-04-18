package com.bookflow.backend.auth.dto;

public record AuthResponse(String token, UserResponse user) {
}
