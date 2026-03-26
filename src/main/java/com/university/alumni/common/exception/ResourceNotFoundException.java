package com.university.alumni.common.exception;

// ── ResourceNotFoundException ───────────────────────────────────────────────
// Thrown when an entity lookup (findById, etc.) returns empty.
// Maps to HTTP 404.
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
    public static ResourceNotFoundException of(String resource, Object id) {
        return new ResourceNotFoundException(resource + " not found with id: " + id);
    }
}