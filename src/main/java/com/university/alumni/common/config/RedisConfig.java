package com.university.alumni.common.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.Cache;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.jackson2.SecurityJackson2Modules;
import org.springframework.lang.Nullable;
import lombok.extern.slf4j.Slf4j;
import java.net.URI;

import java.time.Duration;
import java.util.Map;

/**
 * Single consolidated Redis + Cache configuration.
 *
 * !! DELETE RedisCacheConfig.java after applying this file !!
 * Having both causes a duplicate CacheManager bean conflict.
 *
 * ObjectMapper setup:
 *  - JavaTimeModule          → Instant, LocalDate fields on entities
 *  - SecurityJackson2Modules → Spring Security types (not strictly needed now
 *                              since CachedUserDetails stores roles as strings,
 *                              but keeps the serializer correct for future use)
 *  - DefaultTyping NON_FINAL with As.PROPERTY → embeds "@class":"com.example.Foo"
 *    as a JSON field rather than a WRAPPER_ARRAY ["com.example.Foo", {...}].
 *    PROPERTY format is required — WRAPPER_ARRAY breaks deserialization of types
 *    that have only single-argument constructors (like SimpleGrantedAuthority).
 */
@Configuration
@EnableCaching
@Slf4j
public class RedisConfig implements CachingConfigurer {

    @Value("${REDIS_URL:#{null}}")
    private String redisUrl;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        if (redisUrl == null || redisUrl.isBlank() || !redisUrl.startsWith("redis")) {
            log.info("Redis: Using default auto-configuration (no REDIS_URL found)");
            return null; 
        }

        try {
            log.info("Redis: Initializing connection factory from REDIS_URL: {}", 
                     redisUrl.replaceAll(":.*@", ":****@")); // Mask password
            
            URI uri = new URI(redisUrl);
            RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
            config.setHostName(uri.getHost());
            config.setPort(uri.getPort() == -1 ? 6379 : uri.getPort());

            if (uri.getUserInfo() != null) {
                String password = uri.getUserInfo();
                if (password.contains(":")) {
                    password = password.split(":", 2)[1];
                }
                config.setPassword(password);
            }

            LettuceClientConfiguration.LettuceClientConfigurationBuilder builder = LettuceClientConfiguration.builder();
            if (redisUrl.startsWith("rediss://")) {
                log.info("Redis: SSL enabled (rediss:// scheme)");
                builder.useSsl().disablePeerVerification(); 
            }

            return new LettuceConnectionFactory(config, builder.build());
        } catch (Exception e) {
            log.error("Redis: Failed to parse REDIS_URL: {}", e.getMessage());
            return null; 
        }
    }

    private ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.registerModules(
                SecurityJackson2Modules.getModules(getClass().getClassLoader()));
        mapper.activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder()
                        .allowIfBaseType(Object.class)
                        .build(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY);   // ← PROPERTY not WRAPPER_ARRAY
        return mapper;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory connectionFactory) {

        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(redisObjectMapper());

        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {

        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(redisObjectMapper());

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration
                .defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigs = Map.of(
                CacheNames.ALUMNI_PROFILES, defaultConfig.entryTtl(Duration.ofMinutes(15)),
                CacheNames.EVENTS,          defaultConfig.entryTtl(Duration.ofMinutes(5)),
                CacheNames.USER_DETAILS,    defaultConfig.entryTtl(Duration.ofMinutes(30)),
                CacheNames.STATS,           defaultConfig.entryTtl(Duration.ofHours(1))
        );

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Redis: GET error for key [{}] in cache [{}]: {}", 
                         key, cache.getName(), exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, @Nullable Object value) {
                log.warn("Redis: PUT error for key [{}] in cache [{}]: {}", 
                         key, cache.getName(), exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Redis: EVICT error for key [{}] in cache [{}]: {}", 
                         key, cache.getName(), exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.warn("Redis: CLEAR error for cache [{}]: {}", 
                         cache.getName(), exception.getMessage());
            }
        };
    }

    public static final class CacheNames {
        public static final String ALUMNI_PROFILES = "alumni_profiles";
        public static final String EVENTS          = "events";
        public static final String USER_DETAILS    = "user_details";
        public static final String STATS           = "stats";
        private CacheNames() {}
    }
}