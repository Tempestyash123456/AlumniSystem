package com.university.alumni;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import jakarta.annotation.PostConstruct;
import java.util.TimeZone;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {
		org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration.class
})
@EnableJpaAuditing                  // Enables @CreatedDate / @LastModifiedDate on entities
@EnableCaching                      // Enables @Cacheable, @CacheEvict
@EnableAsync                        // Enables @Async for non-blocking email/notifications
@EnableScheduling                   // Enables @Scheduled for reminders/jobs
@ConfigurationPropertiesScan        // Auto-registers all @ConfigurationProperties classes
public class AlumniPortalApplication {
	public static void main(String[] args) {
		SpringApplication.run(AlumniPortalApplication.class, args);
	}

	@PostConstruct
	public void init() {
		// Set default JVM timezone to IST
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
	}
}