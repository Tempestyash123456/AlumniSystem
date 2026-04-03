package com.university.alumni.security.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.util.SerializationUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.util.Base64;
import java.util.Optional;

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
     * Adds a secure, HttpOnly cookie with SameSite=Lax.
     * Since standard jakarta.servlet.http.Cookie doesn't support setSameSite easily
     * in all environments, we manually set the header to ensure cross-site reliability.
     */
    public static void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        StringBuilder cookieHeader = new StringBuilder();
        cookieHeader.append(name).append("=").append(value)
                .append("; Path=/; HttpOnly; Max-Age=").append(maxAge)
                .append("; SameSite=Lax");
        
        // Add Secure attribute only in production/HTTPS
        // In a real app, you'd check if the request is secure
        cookieHeader.append("; Secure");

        response.addHeader("Set-Cookie", cookieHeader.toString());
    }

    public static void deleteCookie(HttpServletRequest request, HttpServletResponse response, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null && cookies.length > 0) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    response.addHeader("Set-Cookie", name + "=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure");
                }
            }
        }
    }

    public static String serialize(Object object) {
        return Base64.getUrlEncoder()
                .encodeToString(SerializationUtils.serialize(object));
    }

    public static <T> T deserialize(Cookie cookie, Class<T> cls) {
        byte[] bytes = Base64.getUrlDecoder().decode(cookie.getValue());
        try (ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
            return cls.cast(ois.readObject());
        } catch (IOException | ClassNotFoundException e) {
            throw new IllegalArgumentException("Failed to deserialize object from cookie", e);
        }
    }
}
