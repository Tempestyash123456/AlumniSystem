package com.university.alumni.security.oauth2;

import com.university.alumni.security.service.JwtService;
import com.university.alumni.user.entity.User;
import com.university.alumni.user.repository.UserRepository;
import com.university.alumni.audit.service.AuditLogService;
import com.university.alumni.common.config.AppProperties;


import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final AppProperties appProperties;


    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        String googlePictureUrl = oauth2User.getAttribute("picture");
        String givenName = oauth2User.getAttribute("given_name");
        String familyName = oauth2User.getAttribute("family_name");
        String fullName = oauth2User.getAttribute("name");

        // Fallback logic for missing names
        if (givenName == null || givenName.isBlank()) {
            if (fullName != null && !fullName.isBlank()) {
                String[] parts = fullName.split("\\s+", 2);
                givenName = parts[0];
                if (familyName == null || familyName.isBlank()) {
                    familyName = parts.length > 1 ? parts[1] : "User";
                }
            } else {
                givenName = email != null ? email.split("@")[0] : "Google";
                if (familyName == null || familyName.isBlank()) {
                    familyName = "User";
                }
            }
        }
        if (familyName == null || familyName.isBlank()) {
            familyName = "User";
        }

        final String finalGivenName = givenName;
        final String finalFamilyName = familyName;

        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .firstName(finalGivenName)
                            .lastName(finalFamilyName)
                            .profilePhotoUrl(googlePictureUrl)
                            .passwordHash("{noop}" + UUID.randomUUID())
                            .enabled(true)
                            .accountLocked(false)
                            .roleSelected(false)    // User must pick Alumni or Faculty
                            .build();

                    auditLogService.record("REGISTERED", newUser.getFirstName(), newUser.getLastName(), "Google OAuth");

                    // We no longer assign ROLE_ALUMNI here for new OAuth users
                    User saved = userRepository.save(newUser);
                    userRepository.flush();
                    return saved;
                });

        if (user.getProfilePhotoUrl() == null && googlePictureUrl != null) {
            user.setProfilePhotoUrl(googlePictureUrl);
            user.setProfilePhotoUrl(googlePictureUrl);
            userRepository.save(user);
            userRepository.flush();
        }

        auditLogService.record("LOGGED_IN", user.getFirstName(), user.getLastName(), "Google OAuth");

        String accessToken = jwtService.generateAccessToken(user);

        String frontendUrl = appProperties.getFrontendUrl();

        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/callback")
                .queryParam("token", accessToken)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}