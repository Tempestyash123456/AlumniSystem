package com.university.alumni.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Role entity.
 * Values are seeded in V1 migration: ROLE_ADMIN, ROLE_ALUMNI, ROLE_STUDENT, ROLE_FACULTY
 *
 * Spring Security convention: role names must be prefixed with ROLE_
 * so that hasRole("ADMIN") matches ROLE_ADMIN automatically.
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;        // e.g. "ROLE_ADMIN"

    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // ── Constants for use in @PreAuthorize ───────────────────────────────────
    public static final String ADMIN   = "ROLE_ADMIN";
    public static final String ALUMNI  = "ROLE_ALUMNI";
    public static final String STUDENT = "ROLE_STUDENT";
    public static final String FACULTY = "ROLE_FACULTY";
}