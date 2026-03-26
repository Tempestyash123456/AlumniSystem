package com.university.alumni.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Type-safe binding for all "app.*" properties in application.yml.
 * Inject this bean anywhere instead of using @Value — much cleaner and testable.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Jwt jwt = new Jwt();
    private final Cors cors = new Cors();
    private final Upload upload = new Upload();
    private String frontendUrl;

    @Getter @Setter
    public static class Jwt {
        private String secret;
        private long accessTokenExpiryMs;
        private long refreshTokenExpiryMs;
    }

    @Getter @Setter
    public static class Cors {
        private List<String> allowedOrigins;
    }

    @Getter @Setter
    public static class Upload {
        private int maxFileSizeMb;
        private List<String> allowedImageTypes;
    }
}