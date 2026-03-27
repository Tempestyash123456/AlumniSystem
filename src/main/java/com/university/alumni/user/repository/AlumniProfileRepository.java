package com.university.alumni.user.repository;

import com.university.alumni.user.entity.AlumniProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlumniProfileRepository extends JpaRepository<AlumniProfile, UUID> {

    @Query("SELECT p FROM AlumniProfile p WHERE p.user.id = :userId AND p.deletedAt IS NULL")
    Optional<AlumniProfile> findByUserId(@Param("userId") UUID userId);

    boolean existsByUserId(UUID userId);
}