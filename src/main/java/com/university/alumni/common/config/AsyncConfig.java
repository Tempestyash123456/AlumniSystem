package com.university.alumni.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import java.util.concurrent.Executor;

/**
 * Custom configuration for Spring's @Async execution.
 * Provides a dedicated thread pool to handle bulk operations like email dispatch
 * without blocking the main application flow.
 */
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);        // Minimum 10 threads always open
        executor.setMaxPoolSize(50);         // Can scale up to 50 threads for heavy broadcasts
        executor.setQueueCapacity(500);      // Buffer of 500 emails in queue
        executor.setThreadNamePrefix("Async-");
        executor.initialize();
        return executor;
    }
}
