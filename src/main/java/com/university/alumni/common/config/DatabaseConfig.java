package com.university.alumni.common.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
@Profile("prod")
public class DatabaseConfig {

    @Value("${DATABASE_URL:#{null}}")
    private String databaseUrl;

    @Value("${SPRING_DATASOURCE_URL:#{null}}")
    private String springDatasourceUrl;

    @Bean
    @Primary
    public DataSource dataSource() throws URISyntaxException {
        // Preference for DATABASE_URL as it's standard on Render/Heroku
        String urlToUse = (databaseUrl != null) ? databaseUrl : springDatasourceUrl;

        if (urlToUse == null) {
            throw new RuntimeException("No database URL found in DATABASE_URL or SPRING_DATASOURCE_URL environment variables.");
        }

        // If the URL contains credentials (user:pass@), we must parse it manually
        // regardless of whether it starts with postgres:// or jdbc:postgresql://
        if (urlToUse.contains("@")) {
            String uriString = urlToUse;
            if (uriString.startsWith("jdbc:postgresql://")) {
                uriString = "postgres://" + uriString.substring(18);
            } else if (uriString.startsWith("postgresql://")) {
                uriString = "postgres://" + uriString.substring(13);
            } else if (!uriString.contains("://")) {
                uriString = "postgres://" + uriString;
            }
            return createDataSourceFromUri(uriString);
        }

        // Otherwise, treat as a standard JDBC URL
        HikariConfig config = new HikariConfig();
        String jdbcUrl = urlToUse.startsWith("jdbc:") ? urlToUse : "jdbc:postgresql://" + urlToUse;
        config.setJdbcUrl(jdbcUrl);
        return new HikariDataSource(config);
    }


    private DataSource createDataSourceFromUri(String url) throws URISyntaxException {
        URI dbUri = new URI(url);
        String username = dbUri.getUserInfo().split(":")[0];
        String password = dbUri.getUserInfo().split(":")[1];
        
        // Convert to JDBC format
        String dbUrl = "jdbc:postgresql://" + dbUri.getHost() + ':' + 
                       (dbUri.getPort() == -1 ? "5432" : dbUri.getPort()) + 
                       dbUri.getPath();

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(dbUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        
        // Optimized settings for typical Render database tier
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(2);
        
        return new HikariDataSource(config);
    }
}
