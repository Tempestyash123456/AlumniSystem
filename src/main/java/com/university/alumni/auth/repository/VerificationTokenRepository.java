package com.university.alumni.auth.repository;

import com.university.alumni.auth.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {
    Optional<VerificationToken> findByTokenAndTokenType(String token, VerificationToken.TokenType tokenType);

    @Modifying
    @Query("DELETE FROM VerificationToken t WHERE t.expiryDate < ?1")
    void deleteExpiredTokens(Instant now);
}