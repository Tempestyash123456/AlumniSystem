package com.university.alumni.security.oauth2;

import com.university.alumni.security.util.CookieUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;

/**
 * Persists OAuth2 authorization requests in cookies instead of the server-side HTTP session.
 * Essential for stateless (JWT-based) backends where the 'state' must survive across redirects
 * without using HttpSession.
 */
@Slf4j
@Component
public class HttpCookieOAuth2AuthorizationRequestRepository implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    public static final String OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME = "oauth2_auth_request";
    public static final String REDIRECT_URI_PARAM_COOKIE_NAME = "redirect_uri";
    private static final int COOKIE_EXPIRE_SECONDS = 180;

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        Assert.notNull(request, "request cannot be null");
        
        // Debug: Log all incoming cookies
        if (request.getCookies() != null) {
            StringBuilder cookieList = new StringBuilder();
            for (jakarta.servlet.http.Cookie c : request.getCookies()) {
                cookieList.append(c.getName()).append(", ");
            }
            log.debug("Incoming cookies on callback: [{}]", cookieList.isEmpty() ? "none" : cookieList.substring(0, cookieList.length() - 2));
        } else {
            log.debug("No cookies at all received on callback.");
        }

        return CookieUtils.getCookie(request, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME)
                .map(cookie -> {
                    try {
                        OAuth2AuthorizationRequest authRequest = CookieUtils.deserialize(cookie, OAuth2AuthorizationRequest.class);
                        log.debug("Successfully loaded OAuth2 Authorization Request from cookie. State: {}", authRequest.getState());
                        return authRequest;
                    } catch (Exception e) {
                        log.error("Failed to deserialize OAuth2 Authorization Request from cookie: {}", e.getMessage());
                        return null;
                    }
                })
                .orElseGet(() -> {
                    log.debug("No OAuth2 Authorization Request cookie found: {}", OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
                    return null;
                });
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest, HttpServletRequest request, HttpServletResponse response) {
        Assert.notNull(request, "request cannot be null");
        Assert.notNull(response, "response cannot be null");

        if (authorizationRequest == null) {
            removeAuthorizationRequestCookies(request, response);
            return;
        }

        CookieUtils.addCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME,
                CookieUtils.serialize(authorizationRequest), COOKIE_EXPIRE_SECONDS);

        String redirectUriAfterLogin = request.getParameter(REDIRECT_URI_PARAM_COOKIE_NAME);
        if (redirectUriAfterLogin != null && !redirectUriAfterLogin.isBlank()) {
            CookieUtils.addCookie(request, response, REDIRECT_URI_PARAM_COOKIE_NAME, redirectUriAfterLogin, COOKIE_EXPIRE_SECONDS);
        }
        log.debug("Saved OAuth2 Authorization Request to cookie. State: {}, RedirectURI: {}", 
                authorizationRequest.getState(), redirectUriAfterLogin);
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request, HttpServletResponse response) {
        Assert.notNull(request, "request cannot be null");
        Assert.notNull(response, "response cannot be null");
        
        OAuth2AuthorizationRequest authorizationRequest = this.loadAuthorizationRequest(request);
        removeAuthorizationRequestCookies(request, response);
        return authorizationRequest;
    }

    public void removeAuthorizationRequestCookies(HttpServletRequest request, HttpServletResponse response) {
        CookieUtils.deleteCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
        CookieUtils.deleteCookie(request, response, REDIRECT_URI_PARAM_COOKIE_NAME);
    }
}
