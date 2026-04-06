package com.university.alumni.user.controller;

import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.common.service.FileStorageService;
import com.university.alumni.security.model.CachedUserDetails;
import com.university.alumni.user.repository.AlumniProfileRepository;
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

    private final FileStorageService      fileStorageService;
    private final UserRepository          userRepository;
    private final AlumniProfileRepository profileRepository;

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

    @PostMapping(value = "/bug-report/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadBugReportPhoto(
            @RequestPart("photo") MultipartFile photo,
            @AuthenticationPrincipal CachedUserDetails currentUser) {

        // Check if user is Aditi or Yash (only they can update bug report photos)
        String email = currentUser.getUsername();
        if (!"pandeyaditi0307@gmail.com".equals(email) && !"yashdubey262@gmail.com".equals(email)) {
            return ResponseEntity.status(403).body(ApiResponse.error(
                    new ApiResponse.ApiError(403, "FORBIDDEN", "Only Aditi and Yash can update bug report photos", null)
            ));
        }

        String url = fileStorageService.storeProfilePhoto(photo, currentUser.getId());

        // Persist URL to alumni_profiles table
        profileRepository.findByUserId(currentUser.getId()).ifPresent(profile -> {
            profile.setBugReportPhotoUrl(url);
            profileRepository.save(profile);
        });

        return ResponseEntity.ok(ApiResponse.success(Map.of("bugReportPhotoUrl", url)));
    }
}