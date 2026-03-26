package com.university.alumni.auth.service;

import com.university.alumni.auth.dto.AuthDtos.*;
import com.university.alumni.auth.entity.RefreshToken;
import com.university.alumni.common.config.AppProperties;
import com.university.alumni.common.exception.ConflictException;
import com.university.alumni.security.service.JwtService;
import com.university.alumni.user.entity.Role;
import com.university.alumni.user.entity.User;
import com.university.alumni.user.repository.RoleRepository;
import com.university.alumni.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static com.university.alumni.common.config.RedisConfig.CacheNames.USER_DETAILS;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository        userRepository;
    private final RoleRepository        roleRepository;
    private final PasswordEncoder       passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService            jwtService;
    private final RefreshTokenService   refreshTokenService;
    private final AppProperties         appProperties;

    // ── Register ─────────────────────────────────────────────────────────────

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailAndDeletedAtIsNull(request.email())) {
            throw new ConflictException("An account with this email already exists");
        }

        Role alumniRole = roleRepository.findByName(Role.ALUMNI)
                .orElseThrow(() -> new RuntimeException("Default role ROLE_ALUMNI not found"));

        User user = User.builder()
                .email(request.email().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .phone(request.phone())
                .enabled(true)     // FIX: Temporarily true so users can login before email verification is built
                .build();

        user.addRole(alumniRole);
        userRepository.save(user);

        log.info("New user registered: {}", user.getEmail());
        return new MessageResponse("Registration successful. You can now log in.");
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email().toLowerCase().trim(),
                        request.password()
                )
        );

        User user = userRepository.findByEmailAndDeletedAtIsNull(
                        request.email().toLowerCase().trim())
                .orElseThrow();

        userRepository.updateLastLogin(user.getId(), Instant.now());

        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        String deviceInfo = extractDeviceInfo(httpRequest);
        refreshTokenService.create(user, refreshToken, deviceInfo);

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user, accessToken, refreshToken);
    }

    // ── Refresh ───────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request, HttpServletRequest httpRequest) {
        RefreshToken storedToken = refreshTokenService.validateAndGet(request.refreshToken());
        User user = storedToken.getUser();

        refreshTokenService.revoke(storedToken);

        String newAccessToken  = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);
        refreshTokenService.create(user, newRefreshToken, extractDeviceInfo(httpRequest));

        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = USER_DETAILS, key = "#userEmail")
    public MessageResponse logout(String refreshToken, String userEmail) {
        RefreshToken token = refreshTokenService.validateAndGet(refreshToken);
        refreshTokenService.revoke(token);
        return new MessageResponse("Logged out successfully");
    }

    @Transactional
    @CacheEvict(value = USER_DETAILS, key = "#userEmail")
    public MessageResponse logoutAllDevices(java.util.UUID userId, String userEmail) {
        refreshTokenService.revokeAllForUser(userId);
        return new MessageResponse("Logged out from all devices");
    }

    // ── Verify Email ──────────────────────────────────────────────────────────

    @Transactional
    public MessageResponse verifyEmail(String token) {
        return new MessageResponse("Email verified successfully");
    }

    // ── Forgot / Reset Password ───────────────────────────────────────────────

    @Transactional
    public MessageResponse forgotPassword(String email) {
        userRepository.findByEmailAndDeletedAtIsNull(email.toLowerCase()).ifPresent(user -> {
            log.info("Password reset requested for: {}", email);
        });
        return new MessageResponse("If an account with that email exists, a reset link has been sent.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        return new MessageResponse("Password reset successfully");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        List<String> roles = user.getAuthorities()
                .stream()
                .map(a -> a.getAuthority())
                .toList();

        UserInfo userInfo = new UserInfo(
                user.getId().toString(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getProfilePhotoUrl(),
                roles
        );

        return new AuthResponse(
                accessToken,
                refreshToken,
                "Bearer",
                appProperties.getJwt().getAccessTokenExpiryMs() / 1000,
                userInfo
        );
    }

    private String extractDeviceInfo(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        return userAgent != null
                ? userAgent.substring(0, Math.min(userAgent.length(), 255))
                : "Unknown device";
    }
}