package com.university.alumni.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class PostDtos {

    private PostDtos() {}

    public record PostResponse(
            UUID    id,
            String  title,
            String  description,
            java.util.List<String> imageUrls,
            String  authorFirstName,
            String  authorLastName,
            String  authorProfilePhotoUrl,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record CreatePostRequest(
            @NotBlank(message = "Title is required")
            @Size(max = 300)
            String title,

            @NotBlank(message = "Description is required")
            String description
    ) {}

    public record UpdatePostRequest(
            @Size(max = 300) String title,
            String description,
            java.util.List<String> imageUrls
    ) {}
}