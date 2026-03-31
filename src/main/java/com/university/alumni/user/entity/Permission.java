package com.university.alumni.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Permission entity for fine-grained access control.
 * Can be assigned to Roles (RBAC) or directly to Users (PBAC).
 */
@Entity
@Table(name = "permissions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;        // e.g. "POST_CREATE"

    private String description;
}
