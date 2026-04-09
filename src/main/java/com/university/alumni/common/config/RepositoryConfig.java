package com.university.alumni.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;
import org.springframework.context.annotation.ComponentScan.Filter;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.jpa.repository.JpaRepository;

@Configuration
@EnableJpaRepositories(
    basePackages = "com.university.alumni",
    includeFilters = @Filter(type = FilterType.ASSIGNABLE_TYPE, value = JpaRepository.class)
)
@EnableRedisRepositories(
    basePackages = "com.university.alumni.redis.repository"
    // By default, it will seek @RedisHash, but restricted to this empty package it will find nothing.
)
public class RepositoryConfig {
}
