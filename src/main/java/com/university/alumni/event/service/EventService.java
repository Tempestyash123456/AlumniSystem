package com.university.alumni.event.service;

import com.university.alumni.audit.service.AuditLogService;
import com.university.alumni.common.exception.ResourceNotFoundException;
import com.university.alumni.common.service.FileStorageService;
import com.university.alumni.event.dto.EventDtos.*;
import com.university.alumni.event.entity.Event;
import com.university.alumni.event.repository.EventRepository;
import com.university.alumni.security.model.CachedUserDetails;
import com.university.alumni.user.entity.Role;
import com.university.alumni.user.entity.User;
import com.university.alumni.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository    eventRepository;
    private final UserRepository     userRepository;
    private final FileStorageService fileStorageService;
    private final AuditLogService    auditLogService;

    @Transactional(readOnly = true)
    public List<EventResponse> getAllEvents(CachedUserDetails currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(Role.ADMIN));
        boolean isAlumni = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(Role.ALUMNI));

        List<Event> events = eventRepository.findAllActive();

        // If the user is an Alumni (and not an Admin themselves), show only events created by Admins
        if (isAlumni && !isAdmin) {
            return events.stream()
                    .filter(e -> e.getAuthor().getRoles().stream()
                            .anyMatch(r -> r.getName().equals(Role.ADMIN)))
                    .map(this::toResponse)
                    .toList();
        }

        return events.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventResponse getEvent(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public EventResponse createEvent(UUID authorId,
                                     CreateEventRequest req,
                                     List<MultipartFile> mediaFiles) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authorId));

        Event event = Event.builder()
                .name(req.name())
                .startTime(req.startTime())
                .endTime(req.endTime())
                .place(req.place())
                .description(req.description())
                .author(author)
                .build();

        java.util.List<Event.EventMedia> mediaList = new java.util.ArrayList<>();
        if (mediaFiles != null && !mediaFiles.isEmpty()) {
            for (MultipartFile file : mediaFiles) {
                if (file != null && !file.isEmpty()) {
                    String url = fileStorageService.storeEventMedia(file);
                    String type = file.getContentType() != null && file.getContentType().startsWith("video") ? "VIDEO" : "IMAGE";
                    mediaList.add(new Event.EventMedia(url, type));
                }
            }
        }
        event.setMedia(mediaList);

        EventResponse saved = toResponse(eventRepository.save(event));
        auditLogService.record("CREATED_EVENT", author.getFirstName(), author.getLastName(), event.getName());
        return saved;
    }

    @Transactional
    public EventResponse updateEvent(UUID eventId,
                                     UpdateEventRequest req,
                                     List<MultipartFile> mediaFiles) {
        Event event = findOrThrow(eventId);

        if (req.name()        != null && !req.name().isBlank())        event.setName(req.name());
        if (req.startTime()   != null)                                  event.setStartTime(req.startTime());
        if (req.endTime()     != null)                                  event.setEndTime(req.endTime());
        if (req.place()       != null && !req.place().isBlank())        event.setPlace(req.place());
        if (req.description() != null)                                  event.setDescription(req.description());

        if (Boolean.TRUE.equals(req.removeMedia())) {
            event.setMedia(new java.util.ArrayList<>());
        } else if (mediaFiles != null && !mediaFiles.isEmpty()) {
            java.util.List<Event.EventMedia> newList = new java.util.ArrayList<>();
            for (MultipartFile file : mediaFiles) {
                if (file != null && !file.isEmpty()) {
                    String url = fileStorageService.storeEventMedia(file);
                    String type = file.getContentType() != null && file.getContentType().startsWith("video") ? "VIDEO" : "IMAGE";
                    newList.add(new Event.EventMedia(url, type));
                }
            }
            event.setMedia(newList);
        }

        EventResponse saved = toResponse(eventRepository.save(event));
        User author = event.getAuthor();
        auditLogService.record("UPDATED_EVENT", author.getFirstName(), author.getLastName(), event.getName());
        return saved;
    }

    @Transactional
    public void deleteEvent(UUID eventId) {
        Event event = findOrThrow(eventId);
        String name = event.getName();
        User author = event.getAuthor();
        event.softDelete();
        eventRepository.save(event);
        auditLogService.record("DELETED_EVENT", author.getFirstName(), author.getLastName(), name);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Event findOrThrow(UUID id) {
        return eventRepository.findById(id)
                .filter(e -> e.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + id));
    }

    private EventResponse toResponse(Event e) {
        return new EventResponse(
                e.getId(),
                e.getName(),
                e.getStartTime(),
                e.getEndTime(),
                e.getPlace(),
                e.getDescription(),
                e.getMedia() == null ? java.util.Collections.emptyList() :
                        e.getMedia().stream()
                                .map(m -> new EventMediaResponse(m.getUrl(), m.getType()))
                                .toList(),
                e.getAuthor().getFirstName(),
                e.getAuthor().getLastName(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}