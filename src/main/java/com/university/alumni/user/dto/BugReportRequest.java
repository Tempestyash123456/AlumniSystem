package com.university.alumni.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * Request DTO for reporting a bug.
 */
public record BugReportRequest(
    @NotBlank(message = "Title is required")
    String title,

    @NotBlank(message = "Information is required")
    String information,

    @NotEmpty(message = "At least one recipient must be selected")
    List<String> recipients
) {}
