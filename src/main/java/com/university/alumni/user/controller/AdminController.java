package com.university.alumni.user.controller;

import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.user.dto.AdminDtos.*;
import com.university.alumni.user.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Admin-only endpoints.
 * Route prefix /api/v1/admin/** is already guarded by SecurityConfig (hasRole ADMIN).
 * @PreAuthorize provides an extra method-level safety net.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    // ── Users ─────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('VIEW_DIRECTORY')")
    public ResponseEntity<ApiResponse<AdminUserListResponse>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers()));
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('VIEW_DIRECTORY')")
    public ResponseEntity<ApiResponse<AdminUserDto>> getUserById(
            @PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUserById(userId)));
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('MANAGE_USER') or hasAuthority('DELETE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    // ── Role Management ───────────────────────────────────────────────────────

    @PostMapping("/users/{userId}/roles")
    @PreAuthorize("hasAuthority('MANAGE_PERMISSION') or (hasAuthority('ASSIGN_ADMIN_ROLE') and #request.roleName == 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<AdminUserDto>> assignRole(
            @PathVariable UUID userId,
            @Valid @RequestBody AssignRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminService.assignRole(userId, request)));
    }

    @DeleteMapping("/users/{userId}/roles/{roleName}")
    @PreAuthorize("hasAuthority('MANAGE_PERMISSION') or (hasAuthority('REVOKE_ADMIN_ROLE') and #roleName == 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<AdminUserDto>> removeRole(
            @PathVariable UUID userId,
            @PathVariable String roleName) {
        return ResponseEntity.ok(ApiResponse.success(adminService.removeRole(userId, roleName)));
    }

    // ── Permission Management ─────────────────────────────────────────────────

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('MANAGE_PERMISSION')")
    public ResponseEntity<ApiResponse<List<PermissionDto>>> getAllPermissions() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllPermissions()));
    }

    @PatchMapping("/users/{userId}/permissions")
    @PreAuthorize("hasAuthority('MANAGE_PERMISSION')")
    public ResponseEntity<ApiResponse<AdminUserDto>> updatePermissions(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdatePermissionsRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminService.updateUserPermissions(userId, request)));
    }

    // ── Account Status ────────────────────────────────────────────────────────

    @PatchMapping("/users/{userId}/lock")
    @PreAuthorize("hasAuthority('MANAGE_USER')")
    public ResponseEntity<ApiResponse<AdminUserDto>> setLock(
            @PathVariable UUID userId,
            @Valid @RequestBody LockAccountRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminService.setAccountLock(userId, request)));
    }

    @PatchMapping("/users/{userId}/enable")
    @PreAuthorize("hasAuthority('MANAGE_USER')")
    public ResponseEntity<ApiResponse<AdminUserDto>> setEnabled(
            @PathVariable UUID userId,
            @RequestParam boolean enabled) {
        return ResponseEntity.ok(ApiResponse.success(adminService.setAccountEnabled(userId, enabled)));
    }

    // ── Bulk Email Tool ───────────────────────────────────────────────────────

    @PostMapping("/email/send")
    @PreAuthorize("hasAuthority('SEND_EMAIL')")
    public ResponseEntity<ApiResponse<String>> sendTargetedEmail(
            @Valid @RequestBody BulkEmailRequest request) {
        int emailsSent = adminService.sendTargetedEmails(request);
        return ResponseEntity.ok(ApiResponse.success("Dispatched " + emailsSent + " emails successfully."));
    }
}