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
        this.webClient = webClientBuilder.baseUrl(supabaseUrl).build();
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.bucket = bucket;
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
