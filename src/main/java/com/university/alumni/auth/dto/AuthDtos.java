package com.university.alumni.auth.dto;

import jakarta.validation.constraints.*;

/**
 * All auth DTOs in one file for brevity.
 * In larger teams, split these into separate files per DTO.
 */
public final class AuthDtos {

    private AuthDtos() {}

    // ── Requests ─────────────────────────────────────────────────────────────

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email format is invalid")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, message = "Password must be at least 8 characters")
            String password
    ) {}

    public record RegisterRequest(
            @NotBlank(message = "First name is required")
            @Size(max = 100)
            String firstName,

            @NotBlank(message = "Last name is required")
            @Size(max = 100)
            String lastName,

            @NotBlank(message = "Email is required")
            @Email(message = "Email format is invalid")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 100,
                    message = "Password must be between 8 and 100 characters")
            @Pattern(
                    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$",
                    message = "Password must contain uppercase, lowercase, digit, and special character"
            )
            String password,

            String phone         // Optional
    ) {}

    public record RefreshTokenRequest(
            @NotBlank(message = "Refresh token is required")
            String refreshToken
    ) {}

    public record ForgotPasswordRequest(
            @NotBlank @Email
            String email
    ) {}

    public record ResetPasswordRequest(
            @NotBlank(message = "Token is required")
            String token,

            @NotBlank
            @Size(min = 8, max = 100)
            @Pattern(
                    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$",
                    message = "Password must contain uppercase, lowercase, digit, and special character"
            )
            String newPassword
    ) {}

    public record VerifyEmailRequest(
            @NotBlank(message = "Verification token is required")
            String token
    ) {}

    // ── Responses ────────────────────────────────────────────────────────────

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            String tokenType,        // Always "Bearer"
            long   expiresIn,        // Access token expiry in seconds
            UserInfo user
    ) {}

    public record UserInfo(
            String id,
            String email,
            String firstName,
            String lastName,
            String profilePhotoUrl,
            java.util.List<String> roles
    ) {}

    public record MessageResponse(String message) {}
}