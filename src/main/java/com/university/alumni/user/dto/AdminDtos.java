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
}