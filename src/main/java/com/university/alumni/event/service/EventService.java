package com.university.alumni.event.service;

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
                                     MultipartFile media,
                                     MultipartFile document) {
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

        if (media != null && !media.isEmpty()) {
            String mediaUrl  = fileStorageService.storeEventMedia(media);
            String mediaType = media.getContentType() != null
                    && media.getContentType().startsWith("video") ? "VIDEO" : "IMAGE";
            event.setMediaUrl(mediaUrl);
            event.setMediaType(mediaType);
        }

        if (document != null && !document.isEmpty()) {
            event.setDocumentUrl(fileStorageService.storeEventDocument(document));
            event.setDocumentName(document.getOriginalFilename());
        }

        return toResponse(eventRepository.save(event));
    }

    @Transactional
    public EventResponse updateEvent(UUID eventId,
                                     UpdateEventRequest req,
                                     MultipartFile media,
                                     MultipartFile document) {
        Event event = findOrThrow(eventId);

        if (req.name()        != null && !req.name().isBlank())        event.setName(req.name());
        if (req.startTime()   != null)                                  event.setStartTime(req.startTime());
        if (req.endTime()     != null)                                  event.setEndTime(req.endTime());
        if (req.place()       != null && !req.place().isBlank())        event.setPlace(req.place());
        if (req.description() != null)                                  event.setDescription(req.description());

        if (Boolean.TRUE.equals(req.removeMedia())) {
            event.setMediaUrl(null);
            event.setMediaType(null);
        } else if (media != null && !media.isEmpty()) {
            String mediaUrl  = fileStorageService.storeEventMedia(media);
            String mediaType = media.getContentType() != null
                    && media.getContentType().startsWith("video") ? "VIDEO" : "IMAGE";
            event.setMediaUrl(mediaUrl);
            event.setMediaType(mediaType);
        }

        if (Boolean.TRUE.equals(req.removeDocument())) {
            event.setDocumentUrl(null);
            event.setDocumentName(null);
        } else if (document != null && !document.isEmpty()) {
            event.setDocumentUrl(fileStorageService.storeEventDocument(document));
            event.setDocumentName(document.getOriginalFilename());
        }

        return toResponse(eventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(UUID eventId) {
        Event event = findOrThrow(eventId);
        event.softDelete();
        eventRepository.save(event);
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
                e.getMediaUrl(),
                e.getMediaType(),
                e.getDocumentUrl(),
                e.getDocumentName(),
                e.getAuthor().getFirstName(),
                e.getAuthor().getLastName(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}