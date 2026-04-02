package com.university.alumni.user.service;

import static com.university.alumni.common.config.RedisConfig.CacheNames.USER_DETAILS;
import org.springframework.cache.CacheManager;

import com.university.alumni.auth.service.EmailService;
import com.university.alumni.user.dto.AdminDtos.*;
import com.university.alumni.user.entity.AlumniProfile;
import com.university.alumni.user.entity.Role;
import com.university.alumni.user.entity.User;
import com.university.alumni.user.entity.Permission;
import com.university.alumni.user.repository.AlumniProfileRepository;
import com.university.alumni.user.repository.RoleRepository;
import com.university.alumni.user.repository.UserRepository;
import com.university.alumni.user.repository.PermissionRepository;
import java.util.HashSet;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository          userRepository;
    private final RoleRepository          roleRepository;
    private final AlumniProfileRepository profileRepository;
    private final PermissionRepository    permissionRepository;
    private final EmailService            emailService;
    private final CacheManager            cacheManager;

    // ── List all users ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AdminUserListResponse getAllUsers() {
        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.getDeletedAt() == null)
                .toList();

        List<AdminUserDto> dtos = users.stream()
                .map(this::toAdminDto)
                .toList();

        return new AdminUserListResponse(dtos, dtos.size());
    }

    // ── Get single user ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AdminUserDto getUserById(UUID userId) {
        return toAdminDto(findUserOrThrow(userId));
    }

    // ── Assign a role ─────────────────────────────────────────────────────────

    @Transactional
    public AdminUserDto assignRole(UUID userId, AssignRoleRequest request) {
        User user = findUserOrThrow(userId);
        Role role = roleRepository.findByName(request.roleName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Role not found: " + request.roleName()));
        user.addRole(role);
        User saved = userRepository.save(user);
        evictUserCache(saved.getEmail());
        return toAdminDto(saved);
    }

    // ── Remove a role ─────────────────────────────────────────────────────────

    @Transactional
    public AdminUserDto removeRole(UUID userId, String roleName) {
        User user = findUserOrThrow(userId);
        user.getRoles().removeIf(r -> r.getName().equals(roleName));
        User saved = userRepository.save(user);
        evictUserCache(saved.getEmail());
        return toAdminDto(saved);
    }

    // ── Lock / Unlock account ─────────────────────────────────────────────────

    @Transactional
    public AdminUserDto setAccountLock(UUID userId, LockAccountRequest request) {
        User user = findUserOrThrow(userId);
        user.setAccountLocked(request.lock());
        if (!request.lock()) {
            user.resetFailedLogin();   // Clear failed attempts on unlock
        }
        User saved = userRepository.save(user);
        evictUserCache(saved.getEmail());
        return toAdminDto(saved);
    }

    // ── Enable / Disable account ──────────────────────────────────────────────

    @Transactional
    public AdminUserDto setAccountEnabled(UUID userId, boolean enabled) {
        User user = findUserOrThrow(userId);
        user.setEnabled(enabled);
        User saved = userRepository.save(user);
        evictUserCache(saved.getEmail());
        return toAdminDto(saved);
    }

    // ── Soft delete user ──────────────────────────────────────────────────────

    @Transactional
    public void deleteUser(UUID userId) {
        User user = findUserOrThrow(userId);
        userRepository.delete(user);
        evictUserCache(user.getEmail());
    }

    // ── Permission Management ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PermissionDto> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(p -> new PermissionDto(p.getId(), p.getName(), p.getDescription()))
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminUserDto updateUserPermissions(UUID userId, UpdatePermissionsRequest request) {
        User user = findUserOrThrow(userId);

        // Fetch all requested permissions from DB
        List<Permission> newPermissions = request.permissions().stream()
                .map(name -> permissionRepository.findByName(name)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.BAD_REQUEST, "Permission not found: " + name)))
                .toList();

        // If extra permissions are given, automatically grant ROLE_ADMIN if missing
        if (!newPermissions.isEmpty()) {
            boolean hasAdminRole = user.getRoles().stream()
                    .anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
            if (!hasAdminRole) {
                log.info("Automatically granting ROLE_ADMIN to user {} due to granular permission assignment", user.getEmail());
                Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "ROLE_ADMIN not found in database"));
                user.addRole(adminRole);
            }
        }

        user.setPermissions(new HashSet<>(newPermissions));
        User saved = userRepository.save(user);
        evictUserCache(saved.getEmail());

        return toAdminDto(saved);
    }

    // ── Targeted Bulk Email ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public int sendTargetedEmails(BulkEmailRequest request) {
        log.info("Starting bulk email dispatch. Subject: {}", request.subject());

        List<User> targetUsers;

        if (request.targetUserEmail() != null && !request.targetUserEmail().isBlank()) {
            // Send to a single specific user by email
            // FIX: Using findByEmailAndDeletedAtIsNull instead of findByEmail
            User targetUser = userRepository.findByEmailAndDeletedAtIsNull(request.targetUserEmail())
                    .filter(User::isEnabled)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Active user with email " + request.targetUserEmail() + " not found"));
            targetUsers = List.of(targetUser);
        } else {
            // Find all active alumni profiles
            List<AlumniProfile> profiles = profileRepository.findAll().stream()
                    .filter(p -> p.getUser() != null && p.getUser().getDeletedAt() == null && p.getUser().isEnabled())
                    .collect(Collectors.toList());

            // Apply filters
            if (request.department() != null && !request.department().isBlank()) {
                profiles.removeIf(p -> p.getDepartment() == null || !p.getDepartment().equalsIgnoreCase(request.department()));
            }
            if (request.degree() != null && !request.degree().isBlank()) {
                profiles.removeIf(p -> p.getDegree() == null || !p.getDegree().equalsIgnoreCase(request.degree()));
            }
            if (request.specialization() != null && !request.specialization().isBlank()) {
                profiles.removeIf(p -> p.getSpecialization() == null || !p.getSpecialization().equalsIgnoreCase(request.specialization()));
            }
            if (request.graduationYear() != null) {
                profiles.removeIf(p -> p.getGraduationYear() == null || !p.getGraduationYear().equals(request.graduationYear()));
            }

            // Extract users from the filtered profiles
            targetUsers = profiles.stream().map(AlumniProfile::getUser).distinct().collect(Collectors.toList());
        }

        if (request.targetUserEmail() == null || request.targetUserEmail().isBlank()) {
            // EXCLUDE SENDER: Only for bulk broadcasts, remove the currently authenticated user
            String currentPrincipalName = SecurityContextHolder.getContext().getAuthentication().getName();
            boolean removed = targetUsers.removeIf(u -> u.getEmail().equalsIgnoreCase(currentPrincipalName));
            if (removed) {
                log.info("Excluded sender ({}) from bulk email dispatch.", currentPrincipalName);
            }
        }

        int count = 0;
        for (User user : targetUsers) {
            if (user.getEmail() != null) {
                // Personalize the email slightly if needed, or just send the raw body
                String personalizedBody = request.body().replace("{{firstName}}", user.getFirstName() != null ? user.getFirstName() : "Alumni");
                emailService.sendEmail(user.getEmail(), request.subject(), personalizedBody);
                count++;
            }
        }

        log.info("Finished bulk email dispatch. Sent to {} users.", count);
        return count;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User findUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void evictUserCache(String email) {
        if (email != null) {
            var cache = cacheManager.getCache(USER_DETAILS);
            if (cache != null) {
                cache.evict(email);
            }
        }
    }

    private AdminUserDto toAdminDto(User user) {
        int profileScore = profileRepository.findByUserId(user.getId())
                .map(AlumniProfile::getProfileScore)
                .orElse(0);

        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .toList();

        List<String> directPermissions = user.getPermissions().stream()
                .map(Permission::getName)
                .toList();

        List<String> allPermissions = user.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .filter(a -> !a.startsWith("ROLE_")) // Filter out roles to keep only permissions
                .distinct()
                .toList();

        return new AdminUserDto(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getProfilePhotoUrl(),
                roles,
                directPermissions,
                allPermissions,
                user.isEnabled(),
                user.isAccountLocked(),
                profileScore,
                user.getLastLoginAt(),
                user.getCreatedAt()
        );
    }
}