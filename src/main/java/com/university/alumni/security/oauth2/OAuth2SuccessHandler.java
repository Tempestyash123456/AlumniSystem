package com.university.alumni.security.oauth2;

import com.university.alumni.security.service.JwtService;
import com.university.alumni.user.entity.Role;
import com.university.alumni.user.entity.User;
import com.university.alumni.user.repository.RoleRepository;
import com.university.alumni.user.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        String googlePictureUrl = oauth2User.getAttribute("picture");

        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .firstName(oauth2User.getAttribute("given_name"))
                            .lastName(oauth2User.getAttribute("family_name"))
                            .profilePhotoUrl(googlePictureUrl)
                            .passwordHash("{noop}" + UUID.randomUUID())
                            .enabled(true)
                            .build();

                    Role alumniRole = roleRepository.findByName(Role.ALUMNI)
                            .orElseThrow(() -> new RuntimeException("ROLE_ALUMNI not found"));
                    newUser.addRole(alumniRole);
                    return userRepository.save(newUser);
                });

        if (user.getProfilePhotoUrl() == null && googlePictureUrl != null) {
            user.setProfilePhotoUrl(googlePictureUrl);
            userRepository.save(user);
        }

        String accessToken = jwtService.generateAccessToken(user);

        String baseUrl = request.getScheme() + "://" + request.getServerName();
        if (request.getServerPort() != 80 && request.getServerPort() != 443) {
            baseUrl += ":" + request.getServerPort();
        }

        String targetUrl = UriComponentsBuilder.fromUriString(baseUrl + "/oauth2/callback")
                .queryParam("token", accessToken)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}