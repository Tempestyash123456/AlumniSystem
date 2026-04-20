package com.university.alumni.event.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
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
            List<EventMediaResponse> media,
            String  authorFirstName,
            String  authorLastName,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record CreateEventRequest(
            @NotBlank(message = "Event name is required")
            @Size(max = 300, message = "Event name must not exceed 300 characters")
            String name,

            @NotNull(message = "Start time is required")
            @FutureOrPresent(message = "Start time must be now or in the future")
            Instant startTime,

            Instant endTime,

            @NotBlank(message = "Place is required")
            @Size(max = 500, message = "Place must not exceed 500 characters")
            String place,

            @Size(max = 5000, message = "Description must not exceed 5000 characters")
            String description
    ) {}

    public record UpdateEventRequest(
            @Size(max = 300, message = "Event name must not exceed 300 characters")
            String name,

            Instant startTime,
            Instant endTime,

            @Size(max = 500, message = "Place must not exceed 500 characters")
            String place,

            @Size(max = 5000, message = "Description must not exceed 5000 characters")
            String description,

            @Size(max = 20, message = "A event may have at most 20 media items")
            List<EventMediaResponse> media
    ) {}
}