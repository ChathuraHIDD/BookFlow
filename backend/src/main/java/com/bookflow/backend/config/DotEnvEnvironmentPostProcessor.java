package com.bookflow.backend.config;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertiesPropertySource;

public class DotEnvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "bookflowDotEnv";
    private static final String DOT_ENV_FILE_NAME = ".env";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Properties properties = loadDotEnvProperties();
        if (properties.isEmpty()) {
            return;
        }

        environment.getPropertySources().addFirst(new PropertiesPropertySource(PROPERTY_SOURCE_NAME, properties));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private Properties loadDotEnvProperties() {
        Properties properties = new Properties();
        for (Path candidate : candidatePaths()) {
            if (!Files.isRegularFile(candidate)) {
                continue;
            }

            try (InputStream inputStream = Files.newInputStream(candidate)) {
                properties.load(inputStream);
                break;
            } catch (IOException ignored) {
                // Ignore unreadable .env files and fall back to normal Spring property resolution.
            }
        }
        return properties;
    }

    private List<Path> candidatePaths() {
        Path currentDirectory = Path.of(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        List<Path> candidates = new ArrayList<>();
        candidates.add(currentDirectory.resolve(DOT_ENV_FILE_NAME));
        candidates.add(currentDirectory.resolve("backend").resolve(DOT_ENV_FILE_NAME));
        Path parent = currentDirectory.getParent();
        if (parent != null) {
            candidates.add(parent.resolve(DOT_ENV_FILE_NAME));
            candidates.add(parent.resolve("backend").resolve(DOT_ENV_FILE_NAME));
        }
        return candidates;
    }
}
