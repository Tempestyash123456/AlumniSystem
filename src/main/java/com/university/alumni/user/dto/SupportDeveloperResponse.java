package com.university.alumni.user.dto;

import lombok.Builder;
import java.util.UUID;

/**
 * DTO for developer information displayed on the Bug Report page.
 */
@Builder
public record SupportDeveloperResponse(
    UUID userId,
    String name,
    String email,
    String role,
    String linkedinUrl,
    String githubUrl,
    String bugReportPhotoUrl
) {}
