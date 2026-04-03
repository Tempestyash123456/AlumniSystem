package com.university.alumni.security.util;

import com.university.alumni.security.model.CachedUserDetails;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SecurityUtilsTest {

    @Test
    void validateAccountActive_shouldThrowException_whenUserDisabled() {
        CachedUserDetails user = new CachedUserDetails(
                UUID.randomUUID(), "test@test.com", "hash", "First", "Last", null,
                false, false, true, List.of("ROLE_USER"), List.of()
        );

        assertThrows(AccessDeniedException.class, () -> SecurityUtils.validateAccountActive(user));
    }

    @Test
    void validateAccountActive_shouldThrowException_whenUserLocked() {
        CachedUserDetails user = new CachedUserDetails(
                UUID.randomUUID(), "test@test.com", "hash", "First", "Last", null,
                true, true, true, List.of("ROLE_USER"), List.of()
        );

        assertThrows(AccessDeniedException.class, () -> SecurityUtils.validateAccountActive(user));
    }

    @Test
    void validateAccountActive_shouldNotThrow_whenUserActive() {
        CachedUserDetails user = new CachedUserDetails(
                UUID.randomUUID(), "test@test.com", "hash", "First", "Last", null,
                true, false, true, List.of("ROLE_USER"), List.of()
        );

        assertDoesNotThrow(() -> SecurityUtils.validateAccountActive(user));
    }

    @Test
    void validateAccountActive_shouldNotThrow_whenNotCachedUserDetails() {
        assertDoesNotThrow(() -> SecurityUtils.validateAccountActive("just a string"));
    }
}
