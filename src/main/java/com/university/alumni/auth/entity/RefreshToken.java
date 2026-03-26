package com.university.alumni.auth.entity;

import com.university.alumni.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Persisted refresh token — stored hashed (SHA-256), never plaintext.
 *
 * Why store refresh tokens in DB:
 *  - Allows token revocation (logout from all devices)
 *  - Detects token reuse attacks (refresh token rotation)
 *  - Tracks active sessions per device
 */
@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;       // SHA-256 hash of the raw JWT refresh token

    @Column(name = "device_info")
    private String deviceInfo;      // "Chrome on Windows 11"

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // ── Helpers ──────────────────────────────────────────────────────────────

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public boolean isValid() {
        return !isExpired() && !isRevoked();
    }

    public void revoke() {
        this.revokedAt = Instant.now();
    }
}