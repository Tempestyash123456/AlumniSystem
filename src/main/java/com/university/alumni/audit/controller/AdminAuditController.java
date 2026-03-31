package com.university.alumni.audit.controller;

import com.university.alumni.audit.service.AuditLogService;
import com.university.alumni.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final AuditLogService auditLogService;

    /**
     * SSE stream – admins subscribe and receive events pushed in real-time.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return auditLogService.subscribe();
    }

    /**
     * REST fallback – returns the 10 most recent logs as JSON.
     */
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> recent() {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getRecent()));
    }
}
