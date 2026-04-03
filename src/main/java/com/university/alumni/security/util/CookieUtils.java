package com.university.alumni.security.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.util.SerializationUtils;

import java.io.*;
import java.util.Base64;
import java.util.Optional;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

@Slf4j
public class CookieUtils {

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
    public static void addCookie(HttpServletRequest request, HttpServletResponse response, String name, String value, int maxAge) {
        boolean isSecure = request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));
        
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .path("/")
                .httpOnly(true)
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

    public static void deleteCookie(HttpServletRequest request, HttpServletResponse response, String name) {
        boolean isSecure = request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));
        
        ResponseCookie cookie = ResponseCookie.from(name, "")
                .path("/")
                .httpOnly(true)
                .maxAge(0)
                .secure(isSecure)
                .sameSite(isSecure ? "None" : "Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public static String serialize(Object object) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             GZIPOutputStream gzos = new GZIPOutputStream(baos)) {
            gzos.write(SerializationUtils.serialize(object));
            gzos.finish();
            return Base64.getUrlEncoder().encodeToString(baos.toByteArray());
        } catch (IOException e) {
            log.error("Failed to serialize and compress object: {}", e.getMessage());
            return Base64.getUrlEncoder().encodeToString(SerializationUtils.serialize(object)); // Fallback to uncompressed
        }
    }

    public static <T> T deserialize(Cookie cookie, Class<T> cls) {
        byte[] bytes = Base64.getUrlDecoder().decode(cookie.getValue());
        try (ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
             GZIPInputStream gzis = new GZIPInputStream(bais);
             ObjectInputStream ois = new ObjectInputStream(gzis)) {
            return cls.cast(ois.readObject());
        } catch (IOException | ClassNotFoundException e) {
            // Fallback for uncompressed cookies (during transition)
            try (ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
                return cls.cast(ois.readObject());
            } catch (Exception ex) {
                log.error("Failed to deserialize object from cookie: {}", ex.getMessage());
                throw new IllegalArgumentException("Failed to deserialize object from cookie", ex);
            }
        }
    }
}
