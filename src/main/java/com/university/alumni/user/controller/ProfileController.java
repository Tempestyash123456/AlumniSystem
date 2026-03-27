package com.university.alumni.user.controller;

import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.security.model.CachedUserDetails;
import com.university.alumni.user.dto.ProfileDtos.*;
import com.university.alumni.user.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    /**
     * GET /api/v1/profile
     * Returns the authenticated user's own full profile.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> getMyProfile(
            @AuthenticationPrincipal CachedUserDetails currentUser) {
        return ResponseEntity.ok(
                ApiResponse.success(profileService.getMyProfile(currentUser.getId())));
    }

    /**
     * PUT /api/v1/profile
     * Updates the authenticated user's own profile. All fields optional (patch semantics).
     */
    @PutMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal CachedUserDetails currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success(profileService.updateMyProfile(currentUser.getId(), request)));
    }

    /**
     * GET /api/v1/profile/{userId}
     * Returns any user's profile (public view — for Directory "View Profile").
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfileById(
            @PathVariable java.util.UUID userId) {
        return ResponseEntity.ok(
                ApiResponse.success(profileService.getProfileByUserId(userId)));
    }
}