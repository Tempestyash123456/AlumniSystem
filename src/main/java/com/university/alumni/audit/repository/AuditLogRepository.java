package com.university.alumni.audit.repository;

import com.university.alumni.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findTop10ByOrderByCreatedAtDesc();

    @Modifying
    @Query("DELETE FROM AuditLog a WHERE a.createdAt < :threshold")
    void deleteOldLogs(@Param("threshold") LocalDateTime threshold);
}
