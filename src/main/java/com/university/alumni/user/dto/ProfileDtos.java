package com.university.alumni.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class ProfileDtos {

    private ProfileDtos() {}

    // ── Full profile response (own profile or admin view) ─────────────────────
    public record ProfileResponse(
            UUID   userId,
            String firstName,
            String lastName,
            String email,
            String phone,
            String profilePhotoUrl,

            // Academic
            String  studentId,
            Integer admissionYear,
            Integer graduationYear,
            String  discipline,
            String  program,

            // Professional
            String  currentJobTitle,
            String  currentCompany,
            String  industry,
            Integer experienceYears,
            String  linkedinUrl,
            String  githubUrl,
            String  portfolioUrl,

            // Personal
            String    bio,
            String    city,
            String    state,
            String    country,
            LocalDate dateOfBirth,

            List<String> skills,

            // Meta
            int     profileScore,
            boolean profilePublic,
            boolean openToMentor,
            boolean openToHire,
            String  bugReportPhotoUrl
    ) {}

    // ── Update request ────────────────────────────────────────────────────────
    public record UpdateProfileRequest(
            // User table fields
            @Size(max = 100) String firstName,
            @Size(max = 100) String lastName,
            @Size(max = 20)  String phone,

            // Academic
            @Size(max = 50)  String studentId,
            @Min(1950) @Max(2100) Integer admissionYear,
            @Min(1950) @Max(2100) Integer graduationYear,
            @Size(max = 100) String discipline,
            @Size(max = 150) String program,

            // Professional
            @Size(max = 150) String currentJobTitle,
            @Size(max = 150) String currentCompany,
            @Size(max = 100) String industry,
            @Min(0) @Max(60) Integer experienceYears,
            @Size(max = 500) String linkedinUrl,
            @Size(max = 500) String githubUrl,
            @Size(max = 500) String portfolioUrl,

            // Personal
            String    bio,
            @Size(max = 100) String city,
            @Size(max = 100) String state,
            @Size(max = 100) String country,
            LocalDate dateOfBirth,

            List<@Size(max = 50) String> skills,

            // Visibility
            Boolean profilePublic,
            Boolean openToMentor,
            Boolean openToHire,
            @Size(max = 500) String bugReportPhotoUrl
    ) {}
}