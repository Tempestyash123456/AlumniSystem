package com.university.alumni.user.entity;

import com.university.alumni.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.List;

/**
 * Alumni profile data — extended info beyond the core auth user.
 * One-to-one with User. Created lazily when an alumni first saves their profile.
 */
@Entity
@Table(name = "alumni_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlumniProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // ── Academic ─────────────────────────────────────────────────────────────
    @Column(name = "student_id")
    private String studentId;

    @Column(name = "graduation_year")
    private Integer graduationYear;

    @Column(name = "admission_year")
    private Integer admissionYear;

    @Column(name = "discipline")
    private String discipline;

    @Column(name = "program")
    private String program;

    // ── Professional ─────────────────────────────────────────────────────────
    @Column(name = "current_job_title")
    private String currentJobTitle;

    @Column(name = "current_company")
    private String currentCompany;

    @Column(name = "industry")
    private String industry;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "portfolio_url")
    private String portfolioUrl;

    // ── Personal ─────────────────────────────────────────────────────────────
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "country")
    private String country;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    // ── Skills (PostgreSQL TEXT[]) ────────────────────────────────────────────
    @Column(name = "skills", columnDefinition = "text[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private List<String> skills;

    // ── Scoring & Visibility ──────────────────────────────────────────────────
    @Column(name = "profile_score", nullable = false)
    @Builder.Default
    private int profileScore = 0;

    @Column(name = "is_profile_public", nullable = false)
    @Builder.Default
    private boolean profilePublic = true;

    @Column(name = "is_open_to_mentor", nullable = false)
    @Builder.Default
    private boolean openToMentor = false;

    @Column(name = "is_open_to_hire", nullable = false)
    @Builder.Default
    private boolean openToHire = false;

    // ── Score computation ─────────────────────────────────────────────────────
    /**
     * Recomputes completeness score (0-100) based on filled fields.
     * Call before saving.
     */
    public void recomputeScore() {
        int score = 0;
        if (bio              != null && !bio.isBlank())              score += 15;
        if (currentJobTitle  != null && !currentJobTitle.isBlank())  score += 10;
        if (currentCompany   != null && !currentCompany.isBlank())   score += 10;
        if (graduationYear   != null)                                 score += 5;
        if (admissionYear    != null)                                 score += 5;
        if (discipline       != null && !discipline.isBlank())       score += 10;
        if (program          != null && !program.isBlank())          score += 10;
        if (skills           != null && !skills.isEmpty())           score += 15;
        if (linkedinUrl      != null && !linkedinUrl.isBlank())      score += 10;
        if (city             != null && !city.isBlank())             score += 5;
        if (dateOfBirth      != null)                                 score += 5;
        this.profileScore = Math.min(score, 100);
    }
}