package com.university.alumni.user.repository;

import com.university.alumni.user.dto.PeerGroupDto;
import com.university.alumni.user.entity.AlumniProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlumniProfileRepository extends JpaRepository<AlumniProfile, UUID> {

    @Query("SELECT p FROM AlumniProfile p WHERE p.user.id = :userId AND p.deletedAt IS NULL")
    Optional<AlumniProfile> findByUserId(@Param("userId") UUID userId);

    boolean existsByUserId(UUID userId);

    @Query("SELECT new com.university.alumni.user.dto.PeerGroupDto(p.program, COUNT(p)) " +
           "FROM AlumniProfile p " +
           "WHERE p.program IS NOT NULL AND p.deletedAt IS NULL " +
           "GROUP BY p.program")
    List<PeerGroupDto> countByPrograms();

    @Query("SELECT new com.university.alumni.user.dto.PeerGroupDto(CAST(p.graduationYear AS string), COUNT(p)) " +
           "FROM AlumniProfile p " +
           "WHERE p.program = :program AND p.graduationYear IS NOT NULL AND p.deletedAt IS NULL " +
           "GROUP BY p.graduationYear")
    List<PeerGroupDto> countByGraduationYears(@Param("program") String program);

    @Query("SELECT new com.university.alumni.user.dto.PeerGroupDto(p.country, COUNT(p)) " +
           "FROM AlumniProfile p " +
           "WHERE p.program = :program AND p.graduationYear = :year AND p.country IS NOT NULL AND p.deletedAt IS NULL " +
           "GROUP BY p.country")
    List<PeerGroupDto> countByCountries(@Param("program") String program, @Param("year") Integer year);

    @Query("SELECT new com.university.alumni.user.dto.PeerGroupDto(p.state, COUNT(p)) " +
           "FROM AlumniProfile p " +
           "WHERE p.program = :program AND p.graduationYear = :year AND p.country = :country AND p.state IS NOT NULL AND p.deletedAt IS NULL " +
           "GROUP BY p.state")
    List<PeerGroupDto> countByStates(@Param("program") String program, @Param("year") Integer year, @Param("country") String country);

    @Query("SELECT new com.university.alumni.user.dto.PeerGroupDto(p.city, COUNT(p)) " +
           "FROM AlumniProfile p " +
           "WHERE p.program = :program AND p.graduationYear = :year AND p.country = :country AND p.state = :state AND p.city IS NOT NULL AND p.deletedAt IS NULL " +
           "GROUP BY p.city")
    List<PeerGroupDto> countByCities(@Param("program") String program, @Param("year") Integer year, @Param("country") String country, @Param("state") String state);

    @Query("SELECT p FROM AlumniProfile p " +
           "WHERE p.program = :program AND p.graduationYear = :year AND p.country = :country AND p.state = :state AND p.city = :city AND p.deletedAt IS NULL")
    List<AlumniProfile> findPeers(@Param("program") String program, @Param("year") Integer year, @Param("country") String country, @Param("state") String state, @Param("city") String city);
}