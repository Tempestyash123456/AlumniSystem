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
import java.util.Map;
import java.util.UUID;

/**
 * Stores uploaded files on local disk under ${app.upload.dir}.
 * Returns the public URL path (e.g. "/uploads/profiles/abc.jpg").
 */
@Slf4j
@Service
public class FileStorageService {

    private static final List<String> ALLOWED_IMAGE_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    /**
     * Strict allowlist: maps each permitted MIME type to the single canonical extension.
     * This prevents double-extension attacks (e.g. "shell.php.jpg").
     */
    private static final Map<String, String> MIME_TO_EXT = Map.ofEntries(
            // Images
            Map.entry("image/jpeg",  ".jpg"),
            Map.entry("image/png",   ".png"),
            Map.entry("image/webp",  ".webp"),
            Map.entry("image/gif",   ".gif"),
            // Videos
            Map.entry("video/mp4",       ".mp4"),
            Map.entry("video/webm",      ".webm"),
            Map.entry("video/ogg",       ".ogv"),
            Map.entry("video/quicktime", ".mov"),
            // Documents
            Map.entry("application/pdf", ".pdf"),
            Map.entry("application/msword", ".doc"),
            Map.entry("application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"),
            Map.entry("application/vnd.ms-powerpoint", ".ppt"),
            Map.entry("application/vnd.openxmlformats-officedocument.presentationml.presentation", ".pptx")
    );

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.storage.provider:local}")
    private String storageProvider;

    private final SupabaseStorageService supabaseStorageService;

    public FileStorageService(SupabaseStorageService supabaseStorageService) {
        this.supabaseStorageService = supabaseStorageService;
    }

    // ── Profile Photos ────────────────────────────────────────────────────────

    public String storeProfilePhoto(MultipartFile file, UUID userId) {
        validateImage(file);
        String ext = safeExtension(file.getContentType());
        String filename = "profile_" + userId + "_" + UUID.randomUUID() + ext;
        Path dir = Paths.get(uploadDir, "profiles");
        return store(file, dir, filename, "/uploads/profiles/");
    }

    // ── Post Images ───────────────────────────────────────────────────────────

    public String storePostImage(MultipartFile file) {
        validateImage(file);
        String ext = safeExtension(file.getContentType());
        String filename = "post_" + UUID.randomUUID() + ext;
        Path dir = Paths.get(uploadDir, "posts");
        return store(file, dir, filename, "/uploads/posts/");
    }

    // ── Event Media (image OR video) ──────────────────────────────────────────

    public String storeEventMedia(MultipartFile file) {
        List<String> allowed = List.of(
                "image/jpeg", "image/png", "image/webp", "image/gif",
                "video/mp4", "video/webm", "video/ogg", "video/quicktime"
        );
        long maxSize = 100L * 1024 * 1024; // 100 MB for video

        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("File is empty");

        String contentType = normalizeContentType(file.getContentType());
        if (!allowed.contains(contentType))
            throw new IllegalArgumentException("File type not allowed: " + contentType);
        if (file.getSize() > maxSize)
            throw new IllegalArgumentException("File exceeds 100 MB limit");

        String ext      = safeExtension(contentType);
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

        String contentType = normalizeContentType(file.getContentType());
        if (!allowed.contains(contentType))
            throw new IllegalArgumentException("Document type not allowed: " + contentType);
        if (file.getSize() > maxSize)
            throw new IllegalArgumentException("Document exceeds 50 MB limit");

        String ext      = safeExtension(contentType);
        String filename = "event_doc_" + UUID.randomUUID() + ext;
        Path   dir      = Paths.get(uploadDir, "events", "docs");
        return store(file, dir, filename, "/uploads/events/docs/");
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private String store(MultipartFile file, Path dir, String filename, String urlPrefix) {
        if ("supabase".equalsIgnoreCase(storageProvider)) {
            // RELATIVIZE to get folder structure (e.g. "profiles", "posts", "events/media")
            String relativeDirPath = uploadDir.isEmpty() ? dir.toString() : Paths.get(uploadDir).relativize(dir).toString();
            return supabaseStorageService.uploadFile(file, relativeDirPath, filename);
        }

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

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        String contentType = normalizeContentType(file.getContentType());
        if (!ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("File type not allowed: " + contentType);
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("File exceeds 5 MB limit");
        }
    }

    /**
     * Returns the canonical extension for a MIME type from the strict allowlist.
     * Refuses to derive an extension from the original filename, preventing
     * double-extension attacks such as "shell.php.jpg".
     *
     * @throws IllegalArgumentException if the MIME type is not on the allowlist.
     */
    private String safeExtension(String mimeType) {
        String ext = MIME_TO_EXT.get(normalizeContentType(mimeType));
        if (ext == null) {
            throw new IllegalArgumentException("Unsupported MIME type: " + mimeType);
        }
        return ext;
    }

    /**
     * Strips parameters (e.g. "; charset=utf-8") from a content-type header value
     * and lower-cases it. Returns "application/octet-stream" for null input.
     */
    private String normalizeContentType(String contentType) {
        if (contentType == null) return "application/octet-stream";
        int semi = contentType.indexOf(';');
        return (semi >= 0 ? contentType.substring(0, semi) : contentType).trim().toLowerCase();
    }
}