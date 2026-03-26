package com.university.alumni.common.exception;

// ── ConflictException ───────────────────────────────────────────────────────
// Thrown on duplicate key violations (e.g. email already registered).
// Maps to HTTP 409.
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}

