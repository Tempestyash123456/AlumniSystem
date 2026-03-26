package com.university.alumni.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.security.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Runs once per request, before Spring Security's UsernamePasswordAuthenticationFilter.
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Validate signature and structure
 * 3. Load UserDetails from DB (or cache)
 * 4. If valid ? set Authentication in SecurityContextHolder
 * 5. Continue filter chain
 *
 * If the token is missing, the request continues unauthenticated ?
 * Spring Security will reject it at the endpoint level if authentication is required.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final ObjectMapper objectMapper;

    private static final String BEARER_PREFIX = "Bearer ";

    // Define exact paths that should completely bypass JWT inspection
    private static final Set<String> EXACT_PUBLIC_PATHS = Set.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/refresh", // Assuming you have a refresh endpoint
            "/api/v1/health"
    );

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // Skip filter for exact public auth endpoints so we don't accidentally
        // reject them if a user sends a malformed token while trying to log in.
        if (isPublicPath(request.getServletPath())) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        // No Authorization header ? continue unauthenticated (Spring Security handles 401)
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(BEARER_PREFIX.length());

        // Fast structure/signature check before hitting the DB
        if (!jwtService.isTokenStructureValid(jwt)) {
            writeErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "INVALID_TOKEN", "JWT token is malformed or signature invalid");
            return;
        }

        // Reject refresh tokens used as access tokens
        if ("REFRESH".equals(jwtService.extractTokenType(jwt))) {
            writeErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "WRONG_TOKEN_TYPE", "Refresh token cannot be used for API access");
            return;
        }

        try {
            final String username = jwtService.extractUsername(jwt);

            // Only authenticate if not already authenticated in this request
            if (username != null &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,                        // credentials null ? already authenticated
                                    userDetails.getAuthorities()
                            );
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("Authenticated user '{}' for path '{}'",
                            username, request.getServletPath());
                }
            }
        } catch (Exception e) {
            log.error("Could not set user authentication in security context", e);
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    // -- Helpers -------------------------------------------------------------

    /**
     * Checks if the current request path is explicitly public.
     * Uses a Set for exact matches, and startsWith for wildcard directories.
     */
    private boolean isPublicPath(String path) {
        return EXACT_PUBLIC_PATHS.contains(path) || path.startsWith("/actuator/");
    }

    private void writeErrorResponse(HttpServletResponse response,
                                    int status,
                                    String code,
                                    String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiResponse<Void> errorResponse = ApiResponse.error(
                new ApiResponse.ApiError(status, code, message, null));

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}