package com.university.alumni.security.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

@Slf4j
public class CookieUtils {

    private static final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    public static Optional<Cookie> getCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null && cookies.length > 0) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    return Optional.of(cookie);
                }
            }
        }
        return Optional.empty();
    }

    /**
     * Adds a cookie using Spring's ResponseCookie for better security and flexible SameSite options.
     * In production (HTTPS), it sets SameSite=None to allow cross-domain redirects from Google.
     */
    public static void addCookie(HttpServletRequest request, HttpServletResponse response, String name, String value, int maxAge, boolean httpOnly) {
        boolean isSecure = request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));
        
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .path("/")
                .httpOnly(httpOnly)
                .maxAge(maxAge)
                .secure(isSecure)
                .sameSite(isSecure ? "None" : "Lax") 
                .build();

        String cookieString = cookie.toString();
        log.debug("Adding cookie: name={}, size={}, isSecure={}, sameSite={}", 
                name, cookieString.length(), isSecure, isSecure ? "None" : "Lax");
        
        if (cookieString.length() > 4096) {
            log.warn("Cookie '{}' exceeds 4KB (size={}) and may be ignored by browsers!", name, cookieString.length());
        }

        response.addHeader(HttpHeaders.SET_COOKIE, cookieString);
    }

    public static void deleteCookie(HttpServletRequest request, HttpServletResponse response, String name, boolean httpOnly) {
        boolean isSecure = request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));
        
        ResponseCookie cookie = ResponseCookie.from(name, "")
                .path("/")
                .httpOnly(httpOnly)
                .maxAge(0)
                .secure(isSecure)
                .sameSite(isSecure ? "None" : "Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * Serializes an object to a Base64-encoded GZIP-compressed JSON string.
     * Replaces insecure Java native serialization.
     */
    public static String serialize(Object object) {
        try {
            String json = objectMapper.writeValueAsString(object);
            byte[] data = json.getBytes(StandardCharsets.UTF_8);

            try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
                 GZIPOutputStream gzos = new GZIPOutputStream(baos)) {
                gzos.write(data);
                gzos.finish();
                return Base64.getUrlEncoder().encodeToString(baos.toByteArray());
            }
        } catch (IOException e) {
            log.error("Failed to serialize and compress object with Jackson: {}", e.getMessage());
            throw new RuntimeException("Serialization failed", e);
        }
    }

    /**
     * Deserializes an object from a Base64-encoded GZIP-compressed JSON string cookie.
     */
    public static <T> T deserialize(Cookie cookie, Class<T> cls) {
        try {
            byte[] bytes = Base64.getUrlDecoder().decode(cookie.getValue());
            
            try (ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
                 GZIPInputStream gzis = new GZIPInputStream(bais)) {
                
                byte[] decompressed = gzis.readAllBytes();
                String json = new String(decompressed, StandardCharsets.UTF_8);
                return objectMapper.readValue(json, cls);
            }
        } catch (Exception e) {
            log.warn("Failed to deserialize JSON cookie (might be old format or corrupted): {}", e.getMessage());
            // We no longer provide a fallback to ObjectInputStream as it's the security risk we're removing.
            // Old cookies will simply fail, which is acceptable for security.
            throw new IllegalArgumentException("Failed to deserialize object from cookie", e);
        }
    }
}
