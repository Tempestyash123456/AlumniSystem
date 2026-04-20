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
            @Size(max = 254, message = "Email must not exceed 254 characters")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
            String password
    ) {}

    public record RegisterRequest(
            @NotBlank(message = "First name is required")
            @Size(max = 100, message = "First name must not exceed 100 characters")
            String firstName,

            @NotBlank(message = "Last name is required")
            @Size(max = 100, message = "Last name must not exceed 100 characters")
            String lastName,

            @NotBlank(message = "Email is required")
            @Email(message = "Email format is invalid")
            @Size(max = 254, message = "Email must not exceed 254 characters")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 100,
                    message = "Password must be between 8 and 100 characters")
            @Pattern(
                    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$",
                    message = "Password must contain uppercase, lowercase, digit, and special character"
            )
            String password,

            @NotBlank(message = "ID is required")
            @Size(max = 50, message = "Student ID must not exceed 50 characters")
            @Pattern(regexp = "^[A-Za-z0-9\\-_./]{1,50}$",
                    message = "Student ID contains invalid characters")
            String studentId,

            // Optional — accept common international phone formats
            @Size(max = 20, message = "Phone number must not exceed 20 characters")
            @Pattern(regexp = "^$|^[+]?[0-9 ()\\-\\.]{7,20}$",
                    message = "Phone number format is invalid")
            String phone,

            @NotBlank(message = "Role is required")
            @Pattern(regexp = "^(?i)(alumni|faculty)$", message = "Role must be either ALUMNI or FACULTY")
            String role
    ) {}

    public record RefreshTokenRequest(
            @NotBlank(message = "Refresh token is required")
            @Size(max = 1024, message = "Refresh token is malformed")
            String refreshToken
    ) {}

    public record ForgotPasswordRequest(
            @NotBlank @Email
            @Size(max = 254, message = "Email must not exceed 254 characters")
            String email
    ) {}

    public record ResetPasswordRequest(
            @NotBlank(message = "Token is required")
            @Size(max = 1024, message = "Reset token is malformed")
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
            @Size(max = 1024, message = "Verification token is malformed")
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
            java.util.List<String> roles,
            java.util.List<String> permissions,
            boolean accountLocked,
            boolean enabled,
            boolean roleSelected
    ) {}

    public record CompleteOAuthRegistrationRequest(
            @NotBlank(message = "Role is required")
            @Pattern(regexp = "^(?i)(alumni|faculty)$", message = "Role must be either ALUMNI or FACULTY")
            String role,

            @NotBlank(message = "ID is required")
            @Size(max = 50, message = "Student ID must not exceed 50 characters")
            @Pattern(regexp = "^[A-Za-z0-9\\-_./]{1,50}$",
                    message = "Student ID contains invalid characters")
            String studentId
    ) {}

    public record MessageResponse(String message) {}
}