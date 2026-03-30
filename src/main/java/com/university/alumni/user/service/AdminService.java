package com.university.alumni.user.service;

import com.university.alumni.auth.service.EmailService;
import com.university.alumni.user.dto.AdminDtos.*;
import com.university.alumni.user.entity.AlumniProfile;
import com.university.alumni.user.entity.Role;
import com.university.alumni.user.entity.User;
import com.university.alumni.user.repository.AlumniProfileRepository;
import com.university.alumni.user.repository.RoleRepository;
import com.university.alumni.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private final EmailService            emailService;

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
        return toAdminDto(userRepository.save(user));
    }

    // ── Remove a role ─────────────────────────────────────────────────────────

    @Transactional
    public AdminUserDto removeRole(UUID userId, String roleName) {
        User user = findUserOrThrow(userId);
        user.getRoles().removeIf(r -> r.getName().equals(roleName));
        return toAdminDto(userRepository.save(user));
    }

    // ── Lock / Unlock account ─────────────────────────────────────────────────

    @Transactional
    public AdminUserDto setAccountLock(UUID userId, LockAccountRequest request) {
        User user = findUserOrThrow(userId);
        user.setAccountLocked(request.lock());
        if (!request.lock()) {
            user.resetFailedLogin();   // Clear failed attempts on unlock
        }
        return toAdminDto(userRepository.save(user));
    }

    // ── Enable / Disable account ──────────────────────────────────────────────

    @Transactional
    public AdminUserDto setAccountEnabled(UUID userId, boolean enabled) {
        User user = findUserOrThrow(userId);
        user.setEnabled(enabled);
        return toAdminDto(userRepository.save(user));
    }

    // ── Soft delete user ──────────────────────────────────────────────────────

    @Transactional
    public void deleteUser(UUID userId) {
        User user = findUserOrThrow(userId);
        userRepository.delete(user);
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

    private AdminUserDto toAdminDto(User user) {
        int profileScore = profileRepository.findByUserId(user.getId())
                .map(AlumniProfile::getProfileScore)
                .orElse(0);

        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .toList();

        return new AdminUserDto(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getProfilePhotoUrl(),
                roles,
                user.isEnabled(),
                user.isAccountLocked(),
                profileScore,
                user.getLastLoginAt(),
                user.getCreatedAt()
        );
    }
}