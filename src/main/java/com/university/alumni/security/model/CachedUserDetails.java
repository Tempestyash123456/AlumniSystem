package com.university.alumni.security.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

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
                .map(role -> role.getName())
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

    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
    }

    @Override
    @JsonIgnore
    public String getPassword() { return passwordHash; }

    @Override
    @JsonIgnore
    public String getUsername() { return email; }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() { return !accountLocked; }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() { return true; }

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return enabled; }

    // ── Extra fields & Getters for Jackson Serialization ──────────────────────

    public UUID   getId()              { return id; }
    public String getEmail()           { return email; }
    public String getFirstName()       { return firstName; }
    public String getLastName()        { return lastName; }
    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public List<String> getRoles()     { return roles; }

    // FIX: These two getters tell Jackson to save the password and locked status into Redis
    public String getPasswordHash()    { return passwordHash; }
    public boolean getAccountLocked()  { return accountLocked; }
}