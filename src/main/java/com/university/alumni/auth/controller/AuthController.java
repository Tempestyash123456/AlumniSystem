package com.university.alumni.auth.controller;

import com.university.alumni.auth.dto.AuthDtos.*;
import com.university.alumni.auth.service.AuthService;
import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.security.model.CachedUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<MessageResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(authService.register(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request, httpRequest)));
    }

    @PostMapping("/complete-oauth-registration")
    public ResponseEntity<ApiResponse<AuthResponse>> completeOAuthRegistration(
            @AuthenticationPrincipal CachedUserDetails currentUser,
            @Valid @RequestBody CompleteOAuthRegistrationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.completeOAuthRegistration(request, currentUser.getEmail())));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.success(authService.refresh(request, httpRequest)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<MessageResponse>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.forgotPassword(request.email())));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<MessageResponse>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.resetPassword(request)));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<MessageResponse>> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.verifyEmail(request.token())));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<MessageResponse>> logout(
            @Valid @RequestBody RefreshTokenRequest request,
            @AuthenticationPrincipal CachedUserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                authService.logout(request.refreshToken(), currentUser.getEmail())));
    }

    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<MessageResponse>> logoutAllDevices(
            @AuthenticationPrincipal CachedUserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                authService.logoutAllDevices(currentUser.getId(), currentUser.getEmail())));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserInfo>> getCurrentUser(
            @AuthenticationPrincipal CachedUserDetails currentUser) {
        UserInfo info = new UserInfo(
                currentUser.getId().toString(),
                currentUser.getEmail(),
                currentUser.getFirstName(),
                currentUser.getLastName(),
                currentUser.getProfilePhotoUrl(),
                currentUser.getRoles(),
                currentUser.getPermissions(),
                currentUser.getAccountLocked(),
                currentUser.isEnabled(),
                currentUser.isRoleSelected()
        );
        return ResponseEntity.ok(ApiResponse.success(info));
    }
}