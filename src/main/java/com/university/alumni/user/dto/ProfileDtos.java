package com.university.alumni.user.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class ProfileDtos {

    private ProfileDtos() {}

    // ── Common URL regex (http/https, max 500 chars) ──────────────────────────
    private static final String URL_PATTERN =
            "^$|^https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]{1,499}$";

    public record JobExperienceDto(
            UUID    id,

            @Size(max = 150, message = "Job title must not exceed 150 characters")
            String  jobTitle,

            @Size(max = 150, message = "Company name must not exceed 150 characters")
            String  company,

            @Size(max = 100, message = "Industry must not exceed 100 characters")
            String  industry,

            @Min(value = 1, message = "Start month must be between 1 and 12")
            @Max(value = 12, message = "Start month must be between 1 and 12")
            Integer startMonth,

            @Min(value = 1950, message = "Start year must be 1950 or later")
            @Max(value = 2100, message = "Start year must be 2100 or earlier")
            Integer startYear,

            @Min(value = 1, message = "End month must be between 1 and 12")
            @Max(value = 12, message = "End month must be between 1 and 12")
            Integer endMonth,

            @Min(value = 1950, message = "End year must be 1950 or later")
            @Max(value = 2100, message = "End year must be 2100 or earlier")
            Integer endYear,

            Integer experienceMonths
    ) {}

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
            List<JobExperienceDto> jobs,
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
            @Size(max = 100, message = "First name must not exceed 100 characters")
            String firstName,

            @Size(max = 100, message = "Last name must not exceed 100 characters")
            String lastName,

            @Size(max = 20, message = "Phone must not exceed 20 characters")
            @Pattern(regexp = "^$|^[+]?[0-9 ()\\-\\.]{7,20}$",
                    message = "Phone number format is invalid")
            String phone,

            // Academic
            @Size(max = 50, message = "Student ID must not exceed 50 characters")
            String studentId,

            @Min(value = 1950, message = "Admission year must be 1950 or later")
            @Max(value = 2100, message = "Admission year must be 2100 or earlier")
            Integer admissionYear,

            @Min(value = 1950, message = "Graduation year must be 1950 or later")
            @Max(value = 2100, message = "Graduation year must be 2100 or earlier")
            Integer graduationYear,

            @Size(max = 100, message = "Discipline must not exceed 100 characters")
            String discipline,

            @Size(max = 150, message = "Program must not exceed 150 characters")
            String program,

            // Professional
            @Size(max = 20, message = "A profile may have at most 20 job entries")
            List<@Valid JobExperienceDto> jobs,

            @Size(max = 500, message = "LinkedIn URL must not exceed 500 characters")
            @Pattern(regexp = URL_PATTERN, message = "LinkedIn URL must be a valid http/https URL")
            String linkedinUrl,

            @Size(max = 500, message = "GitHub URL must not exceed 500 characters")
            @Pattern(regexp = URL_PATTERN, message = "GitHub URL must be a valid http/https URL")
            String githubUrl,

            @Size(max = 500, message = "Portfolio URL must not exceed 500 characters")
            @Pattern(regexp = URL_PATTERN, message = "Portfolio URL must be a valid http/https URL")
            String portfolioUrl,

            // Personal
            @Size(max = 2000, message = "Bio must not exceed 2000 characters")
            String    bio,

            @Size(max = 100, message = "City must not exceed 100 characters")
            String    city,

            @Size(max = 100, message = "State must not exceed 100 characters")
            String    state,

            @Size(max = 100, message = "Country must not exceed 100 characters")
            String    country,

            @Past(message = "Date of birth must be in the past")
            LocalDate dateOfBirth,

            @Size(max = 30, message = "A profile may have at most 30 skills")
            List<@Size(max = 50, message = "Each skill must not exceed 50 characters") String> skills,

            // Visibility
            Boolean profilePublic,
            Boolean openToMentor,
            Boolean openToHire,

            @Size(max = 500, message = "Bug report photo URL must not exceed 500 characters")
            @Pattern(regexp = URL_PATTERN, message = "Bug report photo URL must be a valid http/https URL")
            String bugReportPhotoUrl
    ) {}
}