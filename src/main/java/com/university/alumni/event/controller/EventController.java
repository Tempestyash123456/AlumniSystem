package com.university.alumni.event.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.event.dto.EventDtos.*;
import com.university.alumni.event.service.EventService;
import com.university.alumni.security.model.CachedUserDetails;
import com.university.alumni.security.util.SecurityUtils;
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
 * POST   /api/v1/events          — create  (CREATE_EVENT)
 * PUT    /api/v1/events/{id}     — update  (EDIT_EVENT)
 * DELETE /api/v1/events/{id}     — delete  (DELETE_EVENT)
 */
@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService  eventService;
    private final ObjectMapper  objectMapper;

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_EVENT')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getAll(
            @AuthenticationPrincipal CachedUserDetails currentUser) {
        SecurityUtils.validateAccountActive(currentUser);
        return ResponseEntity.ok(ApiResponse.success(eventService.getAllEvents(currentUser)));
    }

    @GetMapping("/{eventId}")
    @PreAuthorize("hasAuthority('VIEW_EVENT')")
    public ResponseEntity<ApiResponse<EventResponse>> getOne(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal CachedUserDetails currentUser) {
        SecurityUtils.validateAccountActive(currentUser);
        return ResponseEntity.ok(ApiResponse.success(eventService.getEvent(eventId)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('CREATE_EVENT')")
    public ResponseEntity<ApiResponse<EventResponse>> create(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "media", required = false) List<MultipartFile> mediaFiles,
            @AuthenticationPrincipal CachedUserDetails currentUser) throws Exception {

        CreateEventRequest request = objectMapper.readValue(dataJson, CreateEventRequest.class);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(eventService.createEvent(currentUser.getId(), request, mediaFiles)));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('EDIT_EVENT')")
    public ResponseEntity<ApiResponse<EventResponse>> update(
            @PathVariable UUID id,
            @RequestPart("data") String dataJson,
            @RequestPart(value = "media", required = false) List<MultipartFile> mediaFiles) throws Exception {

        UpdateEventRequest request = objectMapper.readValue(dataJson, UpdateEventRequest.class);
        return ResponseEntity.ok(ApiResponse.success(eventService.updateEvent(id, request, mediaFiles)));
    }

    @DeleteMapping("/{eventId}")
    @PreAuthorize("hasAuthority('DELETE_EVENT')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID eventId) {
        eventService.deleteEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success());
    }
}