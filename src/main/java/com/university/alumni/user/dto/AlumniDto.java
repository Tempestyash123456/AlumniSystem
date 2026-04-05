package com.university.alumni.user.dto;

import java.util.UUID;

public record AlumniDto(
        UUID id,
        String firstName,
        String lastName,
        String email,
        String profilePhotoUrl,
        Integer admissionYear,
        Integer graduationYear
) {}