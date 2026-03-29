package com.university.alumni.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Makes the local "uploads/" directory accessible as /uploads/** HTTP path.
 * So a stored file at uploads/profiles/foo.jpg is served at
 * http://localhost:8080/uploads/profiles/foo.jpg
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Expose the upload directory to the web
        exposeDirectory(uploadDir, registry);
    }

    private void exposeDirectory(String dirName, ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(dirName);
        String absPath = uploadPath.toFile().getAbsolutePath();

        // This ensures /uploads/** maps to the file system path
        // We use "file:" prefix to tell Spring it's a local file system path
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + absPath + "/");
    }
}