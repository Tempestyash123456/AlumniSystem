package com.university.alumni.user.dto;

import jakarta.validation.constraints.NotBlank;

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
            @NotBlank String roleName   // e.g. "ROLE_ADMIN", "ROLE_ALUMNI"
    ) {}

    // ── Lock / Unlock request ─────────────────────────────────────────────────
    public record LockAccountRequest(
            boolean lock   // true = lock, false = unlock
    ) {}

    // ── Targeted Bulk Email Request ───────────────────────────────────────────
    public record BulkEmailRequest(
            @NotBlank(message = "Subject is required") String subject,
            @NotBlank(message = "Body is required") String body,

            // Optional filters to target specific alumni
            String department,
            String degree,
            String specialization,
            Integer graduationYear,
            String targetUserEmail // Send to one specific user by email if provided
    ) {}

    // ── Permission Management ────────────────────────────────────────────────
    public record PermissionDto(
            UUID id,
            String name,
            String description
    ) {}

    public record UpdatePermissionsRequest(
            @jakarta.validation.constraints.NotNull List<String> permissions // List of permission names
    ) {}
}