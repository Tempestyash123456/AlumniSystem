package com.university.alumni.user.service;

import com.university.alumni.user.dto.AdminDtos.*;
import com.university.alumni.user.entity.AlumniProfile;
import com.university.alumni.user.entity.Role;
import com.university.alumni.user.entity.User;
import com.university.alumni.user.repository.AlumniProfileRepository;
import com.university.alumni.user.repository.RoleRepository;
import com.university.alumni.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository          userRepository;
    private final RoleRepository          roleRepository;
    private final AlumniProfileRepository profileRepository;

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
//        user.softDelete();
        userRepository.delete(user);
//        userRepository.save(user);
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