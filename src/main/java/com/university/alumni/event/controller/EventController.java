package com.university.alumni.event.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.event.dto.EventDtos.*;
import com.university.alumni.event.service.EventService;
import com.university.alumni.security.model.CachedUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * GET    /api/v1/events          — list all (any authenticated user)
 * GET    /api/v1/events/{id}     — single event
 * POST   /api/v1/events          — create  (ADMIN only, multipart)
 * PUT    /api/v1/events/{id}     — update  (ADMIN only, multipart)
 * DELETE /api/v1/events/{id}     — delete  (ADMIN only)
 */
@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService  eventService;
    private final ObjectMapper  objectMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(eventService.getAllEvents()));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<ApiResponse<EventResponse>> getOne(@PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getEvent(eventId)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EventResponse>> create(
            @RequestPart("data")                              String dataJson,
            @RequestPart(value = "media",    required = false) MultipartFile media,
            @RequestPart(value = "document", required = false) MultipartFile document,
            @AuthenticationPrincipal CachedUserDetails currentUser) throws Exception {

        CreateEventRequest req = objectMapper.readValue(dataJson, CreateEventRequest.class);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        eventService.createEvent(currentUser.getId(), req, media, document)));
    }

    @PutMapping(value = "/{eventId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EventResponse>> update(
            @PathVariable UUID eventId,
            @RequestPart("data")                              String dataJson,
            @RequestPart(value = "media",    required = false) MultipartFile media,
            @RequestPart(value = "document", required = false) MultipartFile document) throws Exception {

        UpdateEventRequest req = objectMapper.readValue(dataJson, UpdateEventRequest.class);
        return ResponseEntity.ok(ApiResponse.success(
                eventService.updateEvent(eventId, req, media, document)));
    }

    @DeleteMapping("/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID eventId) {
        eventService.deleteEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success());
    }
}