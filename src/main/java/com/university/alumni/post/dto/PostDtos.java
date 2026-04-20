package com.university.alumni.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class PostDtos {

    private PostDtos() {}

    public record PostResponse(
            UUID    id,
            String  title,
            String  description,
            List<String> imageUrls,
            String  authorFirstName,
            String  authorLastName,
            String  authorProfilePhotoUrl,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record CreatePostRequest(
            @NotBlank(message = "Title is required")
            @Size(max = 300, message = "Title must not exceed 300 characters")
            String title,

            @NotBlank(message = "Description is required")
            @Size(max = 5000, message = "Description must not exceed 5000 characters")
            String description
    ) {}

    public record UpdatePostRequest(
            @Size(max = 300, message = "Title must not exceed 300 characters")
            String title,

            @Size(max = 5000, message = "Description must not exceed 5000 characters")
            String description,

            @Size(max = 10, message = "A post may have at most 10 images")
            List<@Size(max = 1024, message = "Image URL is too long") String> imageUrls
    ) {}
}