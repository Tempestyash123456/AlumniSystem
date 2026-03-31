package com.university.alumni.auth.service;

import org.springframework.cache.CacheManager;
import com.university.alumni.auth.dto.AuthDtos.*;
import com.university.alumni.auth.entity.RefreshToken;
import com.university.alumni.auth.entity.VerificationToken;
import com.university.alumni.auth.repository.VerificationTokenRepository;
import com.university.alumni.common.config.AppProperties;
import com.university.alumni.common.exception.BadRequestException;
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
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import com.university.alumni.audit.service.AuditLogService;

import static com.university.alumni.common.config.RedisConfig.CacheNames.USER_DETAILS;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final VerificationTokenRepository verificationTokenRepository;
    private final EmailService emailService;
    private final AppProperties appProperties;
    private final CacheManager cacheManager;
    private final AuditLogService auditLogService;

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
                .enabled(false) // Locked until verified
                .accountLocked(true) // Restricted UI features until admin unlocks
                .build();

        user.addRole(alumniRole);
        User saved = userRepository.save(user);

        auditLogService.record("REGISTERED", saved.getFirstName(), saved.getLastName(), null);

        // Generate Verification Token
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
                .token(token)
                .user(user)
                .tokenType(VerificationToken.TokenType.EMAIL_VERIFICATION)
                .expiryDate(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();
        verificationTokenRepository.save(verificationToken);

        // Send Email
        String verifyUrl = "http://localhost:5173/verify-email?token=" + token;
        emailService.sendEmail(user.getEmail(), "Verify your Alumni Account",
                "Click the link to verify your account: " + verifyUrl);

        log.info("New user registered and verification email sent: {}", user.getEmail());
        return new MessageResponse("Registration successful. Please check your email to verify your account.");
    }

    // ── Login & Refresh & Logout (Remains Same as Sprint 1.2) ───────────────

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                request.email().toLowerCase().trim(), request.password()));
        User user = userRepository.findByEmailAndDeletedAtIsNull(request.email().toLowerCase().trim()).orElseThrow();
        userRepository.updateLastLogin(user.getId(), Instant.now());
        auditLogService.record("LOGGED_IN", user.getFirstName(), user.getLastName(), null);
        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        refreshTokenService.create(user, refreshToken, extractDeviceInfo(httpRequest));
        return buildAuthResponse(user, accessToken, refreshToken);
    }

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
        VerificationToken verificationToken = verificationTokenRepository
                .findByTokenAndTokenType(token, VerificationToken.TokenType.EMAIL_VERIFICATION)
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification token"));

        if (verificationToken.isExpired()) {
            throw new BadRequestException("Verification token has expired");
        }

        User user = verificationToken.getUser();
        user.setEnabled(true);
        userRepository.save(user);
        verificationTokenRepository.delete(verificationToken);

        var cache = cacheManager.getCache(USER_DETAILS);
        if (cache != null) {
            cache.evict(user.getEmail());
        }

        return new MessageResponse("Email verified successfully. You can now log in.");
    }

    // ── Forgot / Reset Password ───────────────────────────────────────────────

    @Transactional
    public MessageResponse forgotPassword(String email) {
        userRepository.findByEmailAndDeletedAtIsNull(email.toLowerCase()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            VerificationToken resetToken = VerificationToken.builder()
                    .token(token)
                    .user(user)
                    .tokenType(VerificationToken.TokenType.PASSWORD_RESET)
                    .expiryDate(Instant.now().plus(1, ChronoUnit.HOURS))
                    .build();
            verificationTokenRepository.save(resetToken);

            String resetUrl = "http://localhost:5173/reset-password?token=" + token;
            emailService.sendEmail(user.getEmail(), "Password Reset Request",
                    "Click the link to reset your password: " + resetUrl);
            log.info("Password reset requested for: {}", email);
        });
        return new MessageResponse("If an account with that email exists, a reset link has been sent.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        VerificationToken verificationToken = verificationTokenRepository
                .findByTokenAndTokenType(request.token(), VerificationToken.TokenType.PASSWORD_RESET)
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (verificationToken.isExpired()) {
            throw new BadRequestException("Reset token has expired");
        }

        User user = verificationToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        verificationTokenRepository.delete(verificationToken);

        var cache = cacheManager.getCache(USER_DETAILS);
        if (cache != null) {
            cache.evict(user.getEmail());
        }

        return new MessageResponse("Password reset successfully. You can now log in with your new password.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        List<String> roles = user.getAuthorities().stream().map(a -> a.getAuthority()).toList();
        UserInfo userInfo = new UserInfo(user.getId().toString(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getProfilePhotoUrl(), roles, user.isAccountLocked());
        return new AuthResponse(accessToken, refreshToken, "Bearer", appProperties.getJwt().getAccessTokenExpiryMs() / 1000, userInfo);
    }

    private String extractDeviceInfo(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        return userAgent != null ? userAgent.substring(0, Math.min(userAgent.length(), 255)) : "Unknown device";
    }
}