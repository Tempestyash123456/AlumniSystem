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

        // If it starts with postgres:// (standard URI format provided by Render/Heroku)
        if (urlToUse.startsWith("postgres://")) {
            return createDataSourceFromUri(urlToUse);
        }

        // If it's already a standard jdbc:postgresql:// URL, use it directly
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(urlToUse.startsWith("jdbc:") ? urlToUse : "jdbc:" + urlToUse);
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
