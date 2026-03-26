package com.university.alumni.user.controller;

import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.user.dto.AlumniDto;
import com.university.alumni.user.service.AlumniService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alumni")
@RequiredArgsConstructor
public class AlumniController {

    private final AlumniService alumniService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AlumniDto>>> getAllAlumni() {
        List<AlumniDto> alumni = alumniService.getAllVerifiedAlumni();
        return ResponseEntity.ok(ApiResponse.success(alumni));
    }
}