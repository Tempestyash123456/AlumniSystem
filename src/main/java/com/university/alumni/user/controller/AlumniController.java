package com.university.alumni.user.controller;

import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.user.dto.AlumniDto;
import com.university.alumni.user.dto.PeerGroupDto;
import com.university.alumni.user.service.AlumniService;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
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

    @GetMapping("/peers/programs")
    public ResponseEntity<ApiResponse<List<PeerGroupDto>>> getPeerPrograms() {
        return ResponseEntity.ok(ApiResponse.success(alumniService.getPeerPrograms()));
    }

    @GetMapping("/peers/years")
    public ResponseEntity<ApiResponse<List<PeerGroupDto>>> getPeerYears(
            @RequestParam @Size(max = 150, message = "program filter is too long") String program) {
        return ResponseEntity.ok(ApiResponse.success(alumniService.getPeerGraduationYears(program)));
    }

    @GetMapping("/peers/countries")
    public ResponseEntity<ApiResponse<List<PeerGroupDto>>> getPeerCountries(
            @RequestParam @Size(max = 150, message = "program filter is too long") String program,
            @RequestParam Integer year) {
        return ResponseEntity.ok(ApiResponse.success(alumniService.getPeerCountries(program, year)));
    }

    @GetMapping("/peers/states")
    public ResponseEntity<ApiResponse<List<PeerGroupDto>>> getPeerStates(
            @RequestParam @Size(max = 150, message = "program filter is too long") String program,
            @RequestParam Integer year,
            @RequestParam @Size(max = 100, message = "country filter is too long") String country) {
        return ResponseEntity.ok(ApiResponse.success(alumniService.getPeerStates(program, year, country)));
    }

    @GetMapping("/peers/cities")
    public ResponseEntity<ApiResponse<List<PeerGroupDto>>> getPeerCities(
            @RequestParam @Size(max = 150, message = "program filter is too long") String program,
            @RequestParam Integer year,
            @RequestParam @Size(max = 100, message = "country filter is too long") String country,
            @RequestParam @Size(max = 100, message = "state filter is too long") String state) {
        return ResponseEntity.ok(ApiResponse.success(alumniService.getPeerCities(program, year, country, state)));
    }

    @GetMapping("/peers/list")
    public ResponseEntity<ApiResponse<List<AlumniDto>>> getPeers(
            @RequestParam @Size(max = 150, message = "program filter is too long") String program,
            @RequestParam Integer year,
            @RequestParam @Size(max = 100, message = "country filter is too long") String country,
            @RequestParam @Size(max = 100, message = "state filter is too long") String state,
            @RequestParam @Size(max = 100, message = "city filter is too long") String city) {
        return ResponseEntity.ok(ApiResponse.success(alumniService.getPeers(program, year, country, state, city)));
    }
}