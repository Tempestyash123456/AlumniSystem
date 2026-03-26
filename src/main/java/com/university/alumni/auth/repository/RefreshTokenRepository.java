package com.university.alumni.auth.repository;

import com.university.alumni.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findAllByUserId(UUID userId);

    // Revoke all tokens for a user — used on logout-from-all-devices
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revokedAt = :now WHERE rt.user.id = :userId AND rt.revokedAt IS NULL")
    void revokeAllByUserId(@Param("userId") UUID userId, @Param("now") Instant now);

    // Scheduled cleanup — delete expired/revoked tokens older than 30 days
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :cutoff OR rt.revokedAt < :cutoff")
    void deleteExpiredTokens(@Param("cutoff") Instant cutoff);
}