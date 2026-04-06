package com.university.alumni.user.controller;

import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.user.dto.BugReportRequest;
import com.university.alumni.user.entity.User;
import com.university.alumni.user.service.SupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    @PostMapping("/bug-report")
    public ResponseEntity<ApiResponse<Void>> reportBug(
            @Valid @RequestBody BugReportRequest request,
            @AuthenticationPrincipal User sender
    ) {
        if (!sender.isEnabled() || sender.isAccountLocked()) {
            return ResponseEntity.status(403).body(ApiResponse.error(
                    new ApiResponse.ApiError(403, "ACCESS_DENIED", "Account must be enabled and unlocked to report bugs", null)
            ));
        }

        supportService.sendBugReport(request, sender);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
