package com.university.alumni.user.service;

import com.university.alumni.user.dto.ProfileDtos.*;
import com.university.alumni.audit.service.AuditLogService;
import com.university.alumni.user.entity.AlumniProfile;
import com.university.alumni.user.entity.User;
import com.university.alumni.user.repository.AlumniProfileRepository;
import com.university.alumni.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository          userRepository;
    private final AlumniProfileRepository profileRepository;
    private final AuditLogService         auditLogService;

    // ── GET own profile ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ProfileResponse getMyProfile(UUID userId) {
        User user = findUserOrThrow(userId);
        AlumniProfile profile = profileRepository.findByUserId(userId)
                .orElse(null);   // Profile may not exist yet — that's fine
        return toResponse(user, profile);
    }

    // ── GET any profile by userId (admin or public) ────────────────────────────

    @Transactional(readOnly = true)
    public ProfileResponse getProfileByUserId(UUID userId) {
        User user = findUserOrThrow(userId);
        AlumniProfile profile = profileRepository.findByUserId(userId).orElse(null);
        return toResponse(user, profile);
    }

    // ── UPDATE own profile ────────────────────────────────────────────────────

    @Transactional
    public ProfileResponse updateMyProfile(UUID userId, UpdateProfileRequest req) {
        User user = findUserOrThrow(userId);

        // Update user table fields
        if (req.firstName() != null) user.setFirstName(req.firstName());
        if (req.lastName()  != null) user.setLastName(req.lastName());
        if (req.phone()     != null) user.setPhone(req.phone());
        userRepository.save(user);

        // Upsert alumni_profile
        AlumniProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> AlumniProfile.builder().user(user).build());

        applyUpdates(profile, req);
        profile.recomputeScore();
        profileRepository.save(profile);

        auditLogService.record("UPDATED_PROFILE", user.getFirstName(), user.getLastName(), null);

        return toResponse(user, profile);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User findUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void applyUpdates(AlumniProfile p, UpdateProfileRequest r) {
        if (r.studentId()       != null) p.setStudentId(r.studentId());
        if (r.admissionYear()   != null) p.setAdmissionYear(r.admissionYear());
        if (r.graduationYear()  != null) p.setGraduationYear(r.graduationYear());
        if (r.discipline()      != null) p.setDiscipline(r.discipline());
        if (r.program()         != null) p.setProgram(r.program());
        if (r.currentJobTitle() != null) p.setCurrentJobTitle(r.currentJobTitle());
        if (r.currentCompany()  != null) p.setCurrentCompany(r.currentCompany());
        if (r.industry()        != null) p.setIndustry(r.industry());
        if (r.experienceYears() != null) p.setExperienceYears(r.experienceYears());
        if (r.linkedinUrl()     != null) p.setLinkedinUrl(r.linkedinUrl());
        if (r.githubUrl()       != null) p.setGithubUrl(r.githubUrl());
        if (r.portfolioUrl()    != null) p.setPortfolioUrl(r.portfolioUrl());
        if (r.bio()             != null) p.setBio(r.bio());
        if (r.city()            != null) p.setCity(r.city());
        if (r.state()           != null) p.setState(r.state());
        if (r.country()         != null) p.setCountry(r.country());
        if (r.dateOfBirth()     != null) p.setDateOfBirth(r.dateOfBirth());
        if (r.skills()          != null) p.setSkills(r.skills());
        if (r.profilePublic()   != null) p.setProfilePublic(r.profilePublic());
        if (r.openToMentor()    != null) p.setOpenToMentor(r.openToMentor());
        if (r.openToHire()      != null) p.setOpenToHire(r.openToHire());
        if (r.bugReportPhotoUrl() != null) p.setBugReportPhotoUrl(r.bugReportPhotoUrl());
    }

    public ProfileResponse toResponse(User user, AlumniProfile p) {
        return new ProfileResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getProfilePhotoUrl(),

                p != null ? p.getStudentId()      : null,
                p != null ? p.getAdmissionYear()   : null,
                p != null ? p.getGraduationYear() : null,
                p != null ? p.getDiscipline()     : null,
                p != null ? p.getProgram()        : null,

                p != null ? p.getCurrentJobTitle()  : null,
                p != null ? p.getCurrentCompany()   : null,
                p != null ? p.getIndustry()         : null,
                p != null ? p.getExperienceYears()  : null,
                p != null ? p.getLinkedinUrl()      : null,
                p != null ? p.getGithubUrl()        : null,
                p != null ? p.getPortfolioUrl()     : null,

                p != null ? p.getBio()         : null,
                p != null ? p.getCity()        : null,
                p != null ? p.getState()       : null,
                p != null ? p.getCountry()     : null,
                p != null ? p.getDateOfBirth() : null,
                p != null ? p.getSkills()      : null,

                p != null ? p.getProfileScore() : 0,
                p == null || p.isProfilePublic(),
                p != null && p.isOpenToMentor(),
                p != null && p.isOpenToHire(),
                p != null ? p.getBugReportPhotoUrl() : null
        );
    }
}