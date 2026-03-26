package com.university.alumni.security.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Serialization-safe UserDetails for Redis caching.
 *
 * KEY DESIGN DECISION — authorities stored as List<String>, not List<SimpleGrantedAuthority>:
 *
 *   Jackson's DefaultTyping.NON_FINAL embeds a "@class" type tag for every
 *   non-final field. SimpleGrantedAuthority is non-final, so it gets written
 *   as a two-element array: ["org.springframework...SimpleGrantedAuthority", {...}]
 *   This is the WRAPPER_ARRAY format. On read, Jackson tries to instantiate
 *   SimpleGrantedAuthority from a bean deserializer but it only has a single
 *   String constructor — causing MismatchedInputException every time.
 *
 *   Registering SecurityJackson2Modules helps for some classes but does NOT
 *   fully suppress DefaultTyping wrapper arrays for collection elements.
 *
 *   Solution: store role names as plain List<String> (e.g. ["ROLE_ALUMNI"]).
 *   String is final — DefaultTyping skips it entirely, no type tag emitted.
 *   We reconstruct SimpleGrantedAuthority objects in getAuthorities() on the fly.
 *   This is zero-overhead — getAuthorities() is called infrequently.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CachedUserDetails implements UserDetails {

    private final UUID   id;
    private final String email;
    private final String passwordHash;
    private final String firstName;
    private final String lastName;
    private final String profilePhotoUrl;
    private final boolean enabled;
    private final boolean accountLocked;

    /**
     * Role names stored as plain strings — e.g. ["ROLE_ALUMNI", "ROLE_ADMIN"].
     * String is a final class, so Jackson's NON_FINAL DefaultTyping ignores it.
     * No @class wrapper array is written or expected on read.
     */
    private final List<String> roles;

    @JsonCreator
    public CachedUserDetails(
            @JsonProperty("id")              UUID    id,
            @JsonProperty("email")           String  email,
            @JsonProperty("passwordHash")    String  passwordHash,
            @JsonProperty("firstName")       String  firstName,
            @JsonProperty("lastName")        String  lastName,
            @JsonProperty("profilePhotoUrl") String  profilePhotoUrl,
            @JsonProperty("enabled")         boolean enabled,
            @JsonProperty("accountLocked")   boolean accountLocked,
            @JsonProperty("roles")           List<String> roles
    ) {
        this.id              = id;
        this.email           = email;
        this.passwordHash    = passwordHash;
        this.firstName       = firstName;
        this.lastName        = lastName;
        this.profilePhotoUrl = profilePhotoUrl;
        this.enabled         = enabled;
        this.accountLocked   = accountLocked;
        this.roles           = roles != null ? List.copyOf(roles) : List.of();
    }

    // ── Factory ───────────────────────────────────────────────────────────────

    public static CachedUserDetails from(com.university.alumni.user.entity.User user) {
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName())   // e.g. "ROLE_ALUMNI"
                .toList();

        return new CachedUserDetails(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getFirstName(),
                user.getLastName(),
                user.getProfilePhotoUrl(),
                user.isEnabled(),
                user.isAccountLocked(),
                roles
        );
    }

    // ── UserDetails ───────────────────────────────────────────────────────────

    /**
     * Reconstructs SimpleGrantedAuthority objects from the stored role strings.
     * Called by Spring Security on each request — lightweight, no allocation concern.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
    }

    @Override public String  getPassword()             { return passwordHash; }
    @Override public String  getUsername()             { return email; }
    @Override public boolean isEnabled()               { return enabled; }
    @Override public boolean isAccountNonLocked()      { return !accountLocked; }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }

    // ── Extra fields available via @AuthenticationPrincipal ──────────────────

    public UUID   getId()              { return id; }
    public String getEmail()           { return email; }
    public String getFirstName()       { return firstName; }
    public String getLastName()        { return lastName; }
    public String getProfilePhotoUrl() { return profilePhotoUrl; }

    /** Expose raw role names for callers that need them without constructing authorities. */
    public List<String> getRoles()     { return roles; }
}