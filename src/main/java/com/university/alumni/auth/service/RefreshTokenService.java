package com.university.alumni.auth.service;

import com.university.alumni.auth.entity.RefreshToken;
import com.university.alumni.auth.repository.RefreshTokenRepository;
import com.university.alumni.common.config.AppProperties;
import com.university.alumni.common.exception.BadRequestException;
import com.university.alumni.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Manages the refresh token lifecycle:
 *  - create()   → store hashed token after login
 *  - validate() → find by hash and check validity
 *  - rotate()   → revoke old, issue new (prevents reuse attacks)
 *  - revokeAll()→ logout from all devices
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final AppProperties appProperties;

    // ── Create ───────────────────────────────────────────────────────────────

    @Transactional
    public RefreshToken create(User user, String rawToken, String deviceInfo) {
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .tokenHash(hash(rawToken))
                .deviceInfo(deviceInfo)
                .expiresAt(Instant.now().plusMillis(
                        appProperties.getJwt().getRefreshTokenExpiryMs()))
                .createdAt(Instant.now())
                .build();
        return refreshTokenRepository.save(token);
    }

    // ── Validate ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RefreshToken validateAndGet(String rawToken) {
        String tokenHash = hash(rawToken);
        RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException("Refresh token not found"));

        if (token.isRevoked()) {
            // Possible token reuse attack — revoke all tokens for this user
            log.warn("Revoked refresh token reuse attempt for user {}",
                    token.getUser().getEmail());
            revokeAllForUser(token.getUser().getId());
            throw new BadRequestException("Refresh token has been revoked");
        }

        if (token.isExpired()) {
            throw new BadRequestException("Refresh token has expired");
        }

        return token;
    }

    // ── Rotate (use once, get a new one) ─────────────────────────────────────

    @Transactional
    public void revoke(RefreshToken token) {
        token.revoke();
        refreshTokenRepository.save(token);
    }

    @Transactional
    public void revokeAllForUser(java.util.UUID userId) {
        refreshTokenRepository.revokeAllByUserId(userId, Instant.now());
    }

    // ── Scheduled cleanup every day at 2am ───────────────────────────────────

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        Instant cutoff = Instant.now().minusSeconds(30L * 24 * 60 * 60);  // 30 days ago
        refreshTokenRepository.deleteExpiredTokens(cutoff);
        log.info("Cleaned up expired refresh tokens");
    }

    // ── Hashing ──────────────────────────────────────────────────────────────

    /**
     * SHA-256 hash the raw token before storing.
     * Never store JWT refresh tokens in plaintext — if DB is compromised,
     * hashed tokens cannot be used directly.
     */
    public String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}