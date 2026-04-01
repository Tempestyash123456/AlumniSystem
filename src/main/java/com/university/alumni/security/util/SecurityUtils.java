package com.university.alumni.security.util;

import com.university.alumni.security.model.CachedUserDetails;
import org.springframework.security.access.AccessDeniedException;

public class SecurityUtils {

    public static void validateAccountActive(Object principal) {
        if (principal instanceof CachedUserDetails cached) {
            if (!cached.isEnabled()) {
                throw new AccessDeniedException("Your account is disabled. Please verify your email or contact support.");
            }
            if (cached.getAccountLocked()) {
                throw new AccessDeniedException("Your account is locked. Please contact support.");
            }
        }
    }
}
