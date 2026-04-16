package com.university.alumni.user.entity;

import com.university.alumni.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "job_experiences")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobExperience extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private AlumniProfile profile;

    @Column(name = "job_title", nullable = false)
    private String jobTitle;

    @Column(name = "company", nullable = false)
    private String company;

    @Column(name = "industry")
    private String industry;

    @Column(name = "start_month", nullable = false)
    private Integer startMonth;

    @Column(name = "start_year", nullable = false)
    private Integer startYear;

    @Column(name = "end_month")
    private Integer endMonth;

    @Column(name = "end_year")
    private Integer endYear;

    @Column(name = "experience_months")
    private Integer experienceMonths;
}
