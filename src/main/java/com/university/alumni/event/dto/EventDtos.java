package com.university.alumni.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class EventDtos {

    private EventDtos() {}

    public record EventMediaResponse(String url, String type) {}

    public record EventResponse(
            UUID    id,
            String  name,
            Instant startTime,
            Instant endTime,
            String  place,
            String  description,
            java.util.List<EventMediaResponse> media,
            String  authorFirstName,
            String  authorLastName,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record CreateEventRequest(
            @NotBlank(message = "Event name is required")
            @Size(max = 300)
            String name,

            @NotNull(message = "Start time is required")
            Instant startTime,

            Instant endTime,

            @NotBlank(message = "Place is required")
            @Size(max = 500)
            String place,

            String description
    ) {}

    public record UpdateEventRequest(
            @Size(max = 300) String name,
            Instant startTime,
            Instant endTime,
            @Size(max = 500) String place,
            String description,
            java.util.List<EventMediaResponse> media
    ) {}
}