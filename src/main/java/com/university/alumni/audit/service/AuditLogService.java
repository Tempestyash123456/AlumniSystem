package com.university.alumni.audit.service;

import com.university.alumni.audit.entity.AuditLog;
import com.university.alumni.audit.repository.AuditLogRepository;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    // Thread-safe list of all active admin SSE connections
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    // ── Subscribe (admin opens dashboard) ─────────────────────────────────────
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));

        // Send the last 10 logs immediately on connect as a batch
        try {
            List<AuditLog> recent = auditLogRepository.findTop10ByOrderByCreatedAtDesc();
            for (AuditLog log : recent) {
                emitter.send(SseEmitter.event().name("log").data(toDto(log)));
            }
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    // ── Record a new log ──────────────────────────────────────────────────────
    @Transactional
    public void record(String actionType, String firstName, String lastName, String resourceName) {
        AuditLog entry = AuditLog.builder()
                .actionType(actionType)
                .firstName(firstName)
                .lastName(lastName)
                .resourceName(resourceName)
                .createdAt(LocalDateTime.now())
                .build();

        auditLogRepository.save(entry);
        broadcast(toDto(entry));
    }

    // ── Broadcast to all active emitters ──────────────────────────────────────
    private void broadcast(Map<String, String> dto) {
        List<SseEmitter> dead = new java.util.ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("log").data(dto));
            } catch (IOException e) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }

    // ── Fetch initial 10 for REST fallback ────────────────────────────────────
    @Transactional(readOnly = true)
    public List<Map<String, String>> getRecent() {
        return auditLogRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    // ── Scheduled 7-day cleanup ───────────────────────────────────────────────
    @Scheduled(cron = "0 0 3 * * *") // Runs at 3 AM every day
    @Transactional
    public void cleanupOldLogs() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(7);
        auditLogRepository.deleteOldLogs(threshold);
        log.info("Cleaned up audit logs older than 7 days");
    }

    @PreDestroy
    public void shutdown() {
        emitters.forEach(SseEmitter::complete);
        emitters.clear();
    }

    // ── Map entity → DTO ─────────────────────────────────────────────────────
    private Map<String, String> toDto(AuditLog a) {
        Map<String, String> dto = new java.util.HashMap<>();
        dto.put("id", a.getId() != null ? a.getId().toString() : "");
        dto.put("actionType", a.getActionType() != null ? a.getActionType() : "");
        dto.put("firstName", a.getFirstName() != null ? a.getFirstName() : "");
        dto.put("lastName", a.getLastName() != null ? a.getLastName() : "");
        dto.put("resourceName", a.getResourceName() != null ? a.getResourceName() : "");
        dto.put("createdAt", a.getCreatedAt() != null ? a.getCreatedAt().toString() : "");
        return dto;
    }
}
