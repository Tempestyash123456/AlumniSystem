package com.university.alumni.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * A simple, memory-efficient rate limiter for sensitive authentication endpoints.
 * It tracks requests per IP address using a 1-minute sliding window.
 */
@Slf4j
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, RateLimitInfo> ipCache = new ConcurrentHashMap<>();
    
    private static final int MAX_REQUESTS_PER_MINUTE = 15;
    private static final long WINDOW_MS = 60000;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        
        // Only apply to auth and sensitive routes
        if (path.startsWith("/api/v1/auth/")) {
            String ip = getClientIp(request);
            
            if (isRateLimited(ip)) {
                log.warn("Rate limit exceeded for IP: {} on path: {}", ip, path);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Too many requests. Please try again in a minute.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimited(String ip) {
        long now = System.currentTimeMillis();
        RateLimitInfo info = ipCache.computeIfAbsent(ip, k -> new RateLimitInfo(now));

        synchronized (info) {
            if (now - info.windowStart.get() > WINDOW_MS) {
                // Window expired, reset
                info.windowStart.set(now);
                info.count.set(1);
                return false;
            }

            if (info.count.incrementAndGet() > MAX_REQUESTS_PER_MINUTE) {
                return true;
            }
        }
        return false;
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class RateLimitInfo {
        final AtomicLong windowStart;
        final AtomicInteger count;

        RateLimitInfo(long start) {
            this.windowStart = new AtomicLong(start);
            this.count = new AtomicInteger(1);
        }
    }
}
