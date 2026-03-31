package com.university.alumni.user.repository;

import com.university.alumni.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    // Existing method
    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles LEFT JOIN FETCH u.permissions WHERE u.email = :email AND u.deletedAt IS NULL")
    Optional<User> findByEmailWithRoles(@Param("email") String email);

    boolean existsByEmailAndDeletedAtIsNull(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles LEFT JOIN FETCH u.permissions WHERE u.id = :id AND u.deletedAt IS NULL")
    Optional<User> findByIdWithRoles(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE User u SET u.lastLoginAt = :loginAt, u.failedLoginCount = 0 WHERE u.id = :id")
    void updateLastLogin(@Param("id") UUID id, @Param("loginAt") Instant loginAt);

    @Modifying
    @Query("UPDATE User u SET u.accountLocked = true WHERE u.id = :id")
    void lockAccount(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE User u SET u.enabled = true WHERE u.id = :id")
    void enableUser(@Param("id") UUID id);
}