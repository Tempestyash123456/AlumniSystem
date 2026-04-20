package com.university.alumni.user.dto;

import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class AdminDtos {

    private AdminDtos() {}

    // ── Full user view for admins ─────────────────────────────────────────────
    public record AdminUserDto(
            UUID     id,
            String   firstName,
            String   lastName,
            String   email,
            String   phone,
            String   profilePhotoUrl,
            List<String> roles,
            List<String> permissions,    // Directly assigned
            List<String> allPermissions, // Flattened from roles + direct
            boolean  enabled,
            boolean  accountLocked,
            int      profileScore,
            Integer  admissionYear,
            String   studentId,
            Instant  lastLoginAt,
            Instant  createdAt
    ) {}

    // ── Paginated list response ───────────────────────────────────────────────
    public record AdminUserListResponse(
            List<AdminUserDto> users,
            long totalCount
    ) {}

    // ── Role assignment request ───────────────────────────────────────────────
    public record AssignRoleRequest(
            @NotBlank
            @Size(max = 50, message = "Role name must not exceed 50 characters")
            String roleName   // e.g. "ROLE_ADMIN", "ROLE_ALUMNI"
    ) {}

    // ── Lock / Unlock request ─────────────────────────────────────────────────
    public record LockAccountRequest(
            boolean lock   // true = lock, false = unlock
    ) {}

    // ── Targeted Bulk Email Request ───────────────────────────────────────────
    public record BulkEmailRequest(
            @NotBlank(message = "Subject is required")
            @Size(max = 300, message = "Subject must not exceed 300 characters")
            String subject,

            @NotBlank(message = "Body is required")
            @Size(max = 50_000, message = "Body must not exceed 50 000 characters")
            String body,

            // Optional filters to target specific alumni
            @Size(max = 150, message = "Program filter must not exceed 150 characters")
            String program,

            @Size(max = 150, message = "Discipline filter must not exceed 150 characters")
            String discipline,

            Integer graduationYear,

            @Email(message = "Target user email format is invalid")
            @Size(max = 254, message = "Target user email must not exceed 254 characters")
            String targetUserEmail // Send to one specific user by email if provided
    ) {}

    // ── Permission Management ────────────────────────────────────────────────
    public record PermissionDto(
            UUID id,
            String name,
            String description
    ) {}

    public record UpdatePermissionsRequest(
            @NotNull
            @Size(max = 50, message = "Permission list must not exceed 50 entries")
            List<@Size(max = 100, message = "Permission name is too long") String> permissions // List of permission names
    ) {}
}