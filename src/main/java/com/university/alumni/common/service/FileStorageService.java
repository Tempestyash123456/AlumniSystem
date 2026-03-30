package com.university.alumni.common.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

/**
 * Stores uploaded files on local disk under ${app.upload.dir}.
 * Returns the public URL path (e.g. "/uploads/profiles/abc.jpg").
 */
@Slf4j
@Service
public class FileStorageService {

    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    // ── Profile Photos ────────────────────────────────────────────────────────

    public String storeProfilePhoto(MultipartFile file, UUID userId) {
        validate(file);
        String ext = getExtension(file.getOriginalFilename());
        String filename = "profile_" + userId + "_" + UUID.randomUUID() + ext;
        Path dir = Paths.get(uploadDir, "profiles");
        return store(file, dir, filename, "/uploads/profiles/");
    }

    // ── Post Images ───────────────────────────────────────────────────────────

    public String storePostImage(MultipartFile file) {
        validate(file);
        String ext = getExtension(file.getOriginalFilename());
        String filename = "post_" + UUID.randomUUID() + ext;
        Path dir = Paths.get(uploadDir, "posts");
        return store(file, dir, filename, "/uploads/posts/");
    }

    // ── ADD these two methods inside FileStorageService.java ──────────────────────
// Place them after the existing storePostImage() method.

    // ── Event Media (image OR video) ──────────────────────────────────────────

    public String storeEventMedia(MultipartFile file) {
        // Allow images and common video types
        List<String> allowed = List.of(
                "image/jpeg", "image/png", "image/webp", "image/gif",
                "video/mp4", "video/webm", "video/ogg", "video/quicktime"
        );
        long maxSize = 100L * 1024 * 1024; // 100 MB for video

        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("File is empty");
        if (!allowed.contains(file.getContentType()))
            throw new IllegalArgumentException("File type not allowed: " + file.getContentType());
        if (file.getSize() > maxSize)
            throw new IllegalArgumentException("File exceeds 100 MB limit");

        String ext      = getExtension(file.getOriginalFilename());
        String filename = "event_media_" + UUID.randomUUID() + ext;
        Path   dir      = Paths.get(uploadDir, "events", "media");
        return store(file, dir, filename, "/uploads/events/media/");
    }

    // ── Event Documents (PDF / DOCX / PPTX) ──────────────────────────────────

    public String storeEventDocument(MultipartFile file) {
        List<String> allowed = List.of(
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        );
        long maxSize = 50L * 1024 * 1024; // 50 MB

        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("File is empty");
        if (!allowed.contains(file.getContentType()))
            throw new IllegalArgumentException("Document type not allowed: " + file.getContentType());
        if (file.getSize() > maxSize)
            throw new IllegalArgumentException("Document exceeds 50 MB limit");

        String ext      = getExtension(file.getOriginalFilename());
        String filename = "event_doc_" + UUID.randomUUID() + ext;
        Path   dir      = Paths.get(uploadDir, "events", "docs");
        return store(file, dir, filename, "/uploads/events/docs/");
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private String store(MultipartFile file, Path dir, String filename, String urlPrefix) {
        try {
            Files.createDirectories(dir);
            Path dest = dir.resolve(filename);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored file: {}", dest.toAbsolutePath());
            return urlPrefix + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("File type not allowed: " + file.getContentType());
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("File exceeds 5 MB limit");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf('.'));
    }
}