package com.university.alumni.security.service;

import com.university.alumni.common.config.AppProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

/**
 * Handles all JWT operations:
 *  - Generating access tokens (short-lived, 15 min)
 *  - Generating refresh tokens (long-lived, 7 days)
 *  - Validating and parsing tokens
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JwtService {

    private final AppProperties appProperties;

    // ── Token Generation ────────────────────────────────────────────────────

    /**
     * Generate an access token embedding the user's roles.
     * This token is sent with every API request in the Authorization header.
     */
    public String generateAccessToken(UserDetails userDetails) {
        List<String> roles = userDetails.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return buildToken(
                Map.of("roles", roles, "type", "ACCESS"),
                userDetails.getUsername(),
                appProperties.getJwt().getAccessTokenExpiryMs()
        );
    }

    /**
     * Generate a refresh token.
     * This is stored server-side (hashed in DB) and used only to get new access tokens.
     * Does NOT embed roles — roles are re-read from DB when refreshing.
     */
    public String generateRefreshToken(UserDetails userDetails) {
        return buildToken(
                Map.of("type", "REFRESH"),
                userDetails.getUsername(),
                appProperties.getJwt().getRefreshTokenExpiryMs()
        );
    }

    private String buildToken(Map<String, Object> extraClaims,
                              String subject,
                              long expirationMs) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(subject)
                .setId(UUID.randomUUID().toString())   // jti — unique token ID
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    // ── Token Validation ────────────────────────────────────────────────────

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Validates structure and signature only — used by the filter before loading user.
     * Returns false instead of throwing, so the filter can handle the 401 gracefully.
     */
    public boolean isTokenStructureValid(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT structure: {}", e.getMessage());
            return false;
        }
    }

    // ── Claims Extraction ───────────────────────────────────────────────────

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractTokenId(String token) {
        return extractClaim(token, Claims::getId);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        return (List<String>) extractAllClaims(token).get("roles");
    }

    public String extractTokenType(String token) {
        return (String) extractAllClaims(token).get("type");
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // ── Key ─────────────────────────────────────────────────────────────────

    private SecretKey getSigningKey() {
        // The secret in application.yml must be Base64-encoded and >= 256 bits
        byte[] keyBytes = Decoders.BASE64.decode(appProperties.getJwt().getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }
}