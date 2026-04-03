package com.university.alumni.common.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.IOException;

@Slf4j
@Service
public class SupabaseStorageService {

    private final WebClient webClient;
    private final String supabaseUrl;
    private final String supabaseKey;
    private final String bucket;

    public SupabaseStorageService(
            WebClient.Builder webClientBuilder,
            @Value("${app.supabase.url}") String supabaseUrl,
            @Value("${app.supabase.key}") String supabaseKey,
            @Value("${app.supabase.bucket}") String bucket) {
        
        // Remove trailing slash and accidental quotes that might be in env vars
        this.supabaseUrl = sanitize(supabaseUrl);
        this.supabaseKey = sanitize(supabaseKey);
        this.bucket      = sanitize(bucket);

        log.info("Initializing SupabaseStorageService with URL: {} (Bucket: {})", this.supabaseUrl, this.bucket);

        if (this.supabaseUrl == null || this.supabaseUrl.isBlank() || !this.supabaseUrl.startsWith("http")) {
            log.error("INVALID Supabase URL: '{}'. It must be a non-empty string starting with http.", this.supabaseUrl);
            throw new IllegalArgumentException("Supabase URL is invalid or missing. Check SUPABASE_URL env var.");
        }

        try {
            this.webClient = webClientBuilder.baseUrl(this.supabaseUrl).build();
        } catch (Exception e) {
            log.error("Failed to build WebClient for Supabase at URL: {}. Error: {}", this.supabaseUrl, e.getMessage());
            throw new RuntimeException("Could not initialize Supabase WebClient", e);
        }
    }

    private String sanitize(String s) {
        if (s == null) return null;
        String result = s.trim();
        if (result.startsWith("\"") && result.endsWith("\"")) {
            result = result.substring(1, result.length() - 1);
        }
        if (result.startsWith("'") && result.endsWith("'")) {
            result = result.substring(1, result.length() - 1);
        }
        return result.trim();
    }

    /**
     * Uploads a file to Supabase Storage and returns the public URL.
     */
    public String uploadFile(MultipartFile file, String folder, String filename) {
        String path = folder + "/" + filename;
        try {
            log.info("Uploading to Supabase: {} in bucket {} (folder: {})", filename, bucket, folder);

            byte[] bytes = file.getBytes();

            webClient.post()
                    .uri("/storage/v1/object/{bucket}/{path}", bucket, path)
                    .header("Authorization", "Bearer " + supabaseKey)
                    .contentType(MediaType.parseMediaType(file.getContentType()))
                    .bodyValue(bytes)
                    .retrieve()
                    .onStatus(status -> status.isError(), response -> {
                        return response.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("Supabase Storage Error: Status {} - Body: {}", response.statusCode(), errorBody);
                                    return Mono.error(new RuntimeException("Supabase upload failed: " + errorBody));
                                });
                    })
                    .toBodilessEntity()
                    .block();

            // Public URL format: {supabaseUrl}/storage/v1/object/public/{bucket}/{path}
            String publicUrl = String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, bucket, path);
            log.info("Uploaded to Supabase. Public URL: {}", publicUrl);
            return publicUrl;

        } catch (IOException e) {
            throw new RuntimeException("Failed to read file for Supabase upload", e);
        } catch (Exception e) {
            log.error("Unexpected error during Supabase upload", e);
            throw new RuntimeException("Supabase upload failed", e);
        }
    }
}
