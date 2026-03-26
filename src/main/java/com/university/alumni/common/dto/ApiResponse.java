package com.university.alumni.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

import java.time.Instant;

/**
 * All API responses are wrapped in this enveloped
 * Success:  { "success": true,  "data": {...},  "timestamp": "..." }
 * Error:    { "success": false, "error": {...}, "timestamp": "..." }
 */
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final ApiError error;
    private final Instant timestamp;

    private ApiResponse(boolean success, T data, ApiError error) {
        this.success   = success;
        this.data      = data;
        this.error     = error;
        this.timestamp = Instant.now();
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>(true, null, null);
    }

    public static <T> ApiResponse<T> error(ApiError error) {
        return new ApiResponse<>(false, null, error);
    }

    // ── Inner error record ──────────────────────────────────────────────────
    public record ApiError(
            int status,
            String code,
            String message,
            java.util.Map<String, String> fieldErrors
    ) {}
}