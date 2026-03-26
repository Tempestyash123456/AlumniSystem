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

@Slf4j
@Service
@RequiredArgsConstructor
public class JwtService {

    private final AppProperties appProperties;

    // ── Token Generation ────────────────────────────────────────────────────

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
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    // ── Claims Extraction ───────────────────────────────────────────────────

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    /**
     * FIX: Made this method public so the AuthenticationFilter can fetch all claims at once,
     * drastically reducing CPU overhead. It also naturally throws exceptions if invalid/expired.
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // ── Key ─────────────────────────────────────────────────────────────────

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(appProperties.getJwt().getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }
}