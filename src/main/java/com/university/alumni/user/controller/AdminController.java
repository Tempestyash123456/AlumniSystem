package com.university.alumni.user.controller;

import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.user.dto.AdminDtos.*;
import com.university.alumni.user.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<ApiResponse<AdminUserListResponse>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers()));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<AdminUserDto>> getUserById(
            @PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUserById(userId)));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    // ── Role Management ───────────────────────────────────────────────────────

    @PostMapping("/users/{userId}/roles")
    public ResponseEntity<ApiResponse<AdminUserDto>> assignRole(
            @PathVariable UUID userId,
            @Valid @RequestBody AssignRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminService.assignRole(userId, request)));
    }

    @DeleteMapping("/users/{userId}/roles/{roleName}")
    public ResponseEntity<ApiResponse<AdminUserDto>> removeRole(
            @PathVariable UUID userId,
            @PathVariable String roleName) {
        return ResponseEntity.ok(ApiResponse.success(adminService.removeRole(userId, roleName)));
    }

    // ── Account Status ────────────────────────────────────────────────────────

    @PatchMapping("/users/{userId}/lock")
    public ResponseEntity<ApiResponse<AdminUserDto>> setLock(
            @PathVariable UUID userId,
            @Valid @RequestBody LockAccountRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminService.setAccountLock(userId, request)));
    }

    @PatchMapping("/users/{userId}/enable")
    public ResponseEntity<ApiResponse<AdminUserDto>> setEnabled(
            @PathVariable UUID userId,
            @RequestParam boolean enabled) {
        return ResponseEntity.ok(ApiResponse.success(adminService.setAccountEnabled(userId, enabled)));
    }

    // ── Bulk Email Tool ───────────────────────────────────────────────────────

    @PostMapping("/email/send")
    public ResponseEntity<ApiResponse<String>> sendTargetedEmail(
            @Valid @RequestBody BulkEmailRequest request) {
        int emailsSent = adminService.sendTargetedEmails(request);
        return ResponseEntity.ok(ApiResponse.success("Dispatched " + emailsSent + " emails successfully."));
    }
}