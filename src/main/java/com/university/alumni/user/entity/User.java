package com.university.alumni.user.entity;

import com.university.alumni.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Core User entity.
 * Implements UserDetails so Spring Security can use it directly —
 * no need for a separate UserDetails adapter class.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity implements UserDetails {

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    private String phone;

    @Column(name = "profile_photo_url")
    private String profilePhotoUrl;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private boolean enabled = false;     // False until email verified

    @Column(name = "is_account_locked", nullable = false)
    @Builder.Default
    private boolean accountLocked = false;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "failed_login_count", nullable = false)
    @Builder.Default
    private int failedLoginCount = 0;

    // ── Roles (many-to-many) ─────────────────────────────────────────────────
    @ManyToMany(fetch = FetchType.EAGER)   // EAGER here — roles always needed for auth
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    // ── Permissions (direct assignment) ──────────────────────────────────────
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_permissions",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();

    // ── Convenience helpers ──────────────────────────────────────────────────

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public void incrementFailedLogin() {
        this.failedLoginCount++;
        if (this.failedLoginCount >= 5) {
            this.accountLocked = true;
        }
    }

    public void resetFailedLogin() {
        this.failedLoginCount = 0;
    }

    public void addRole(Role role) {
        this.roles.add(role);
    }

    // ── UserDetails implementation ───────────────────────────────────────────

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Flattened authorities: Roles (ROLE_*) + Permissions inherited from Roles + Direct Permissions
        Set<SimpleGrantedAuthority> authorities = roles.stream()
                .flatMap(role -> Stream.concat(
                        Stream.of(new SimpleGrantedAuthority(role.getName())),
                        role.getPermissions().stream().map(p -> new SimpleGrantedAuthority(p.getName()))
                ))
                .collect(Collectors.toSet());

        // Add direct permissions
        permissions.stream()
                .map(p -> new SimpleGrantedAuthority(p.getName()))
                .forEach(authorities::add);

        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;       // Email is the username in this system
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // Decoupled from accountLocked flag to allow restricted login
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled && getDeletedAt() == null;   // Also check soft-delete
    }
}