package com.university.alumni.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request DTO for reporting a bug.
 */
public record BugReportRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    String title,

    @NotBlank(message = "Information is required")
    @Size(max = 5000, message = "Information must not exceed 5000 characters")
    String information,

    @NotEmpty(message = "At least one recipient must be selected")
    @Size(max = 10, message = "At most 10 recipients are allowed")
    List<@Size(max = 254, message = "Recipient address is too long") String> recipients
) {}
