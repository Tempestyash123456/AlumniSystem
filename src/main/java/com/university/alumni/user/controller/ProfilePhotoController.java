package com.university.alumni.user.controller;

import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.common.service.FileStorageService;
import com.university.alumni.security.model.CachedUserDetails;
import com.university.alumni.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * POST /api/v1/profile/photo — upload / replace profile photo.
 * Returns the new photo URL so the frontend can update state immediately.
 */
@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfilePhotoController {

    private final FileStorageService fileStorageService;
    private final UserRepository     userRepository;

    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadPhoto(
            @RequestPart("photo") MultipartFile photo,
            @AuthenticationPrincipal CachedUserDetails currentUser) {

        String url = fileStorageService.storeProfilePhoto(photo, currentUser.getId());

        // Persist URL to user row
        userRepository.findById(currentUser.getId()).ifPresent(user -> {
            user.setProfilePhotoUrl(url);
            userRepository.save(user);
        });

        return ResponseEntity.ok(ApiResponse.success(Map.of("profilePhotoUrl", url)));
    }
}