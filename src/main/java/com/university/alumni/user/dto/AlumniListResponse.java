package com.university.alumni.user.dto;

import java.util.List;

public record AlumniListResponse(
        List<AlumniDto> alumni,
        long totalCount
) {}
