package com.university.alumni.user.controller;

import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.security.model.CachedUserDetails;
import com.university.alumni.user.dto.BugReportRequest;
import com.university.alumni.user.dto.SupportDeveloperResponse;
import com.university.alumni.user.service.SupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    @PostMapping("/bug-report")
    public ResponseEntity<ApiResponse<Void>> reportBug(
            @Valid @RequestBody BugReportRequest request,
            @AuthenticationPrincipal CachedUserDetails currentUser
    ) {
        if (!currentUser.isEnabled() || currentUser.getAccountLocked()) {
            return ResponseEntity.status(403).body(ApiResponse.error(
                    new ApiResponse.ApiError(403, "ACCESS_DENIED", "Account must be enabled and unlocked to report bugs", null)
            ));
        }

        supportService.sendBugReport(request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success());
    }

    /**
     * GET /api/v1/support/developers
     * Allows all users to see the dev team photos and contact details.
     */
    @GetMapping("/developers")
    public ResponseEntity<ApiResponse<List<SupportDeveloperResponse>>> getDevelopers() {
        return ResponseEntity.ok(ApiResponse.success(supportService.getSupportDevelopers()));
    }
}
