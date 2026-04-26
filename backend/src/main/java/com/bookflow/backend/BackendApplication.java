package com.bookflow.backend;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		loadDotEnv();
		SpringApplication.run(BackendApplication.class, args);
	}

	private static void loadDotEnv() {
		for (Path candidate : List.of(
				Path.of(".env"),
				Path.of("backend", ".env"))) {
			if (!Files.isRegularFile(candidate)) {
				continue;
			}

			try {
				for (String line : Files.readAllLines(candidate, StandardCharsets.UTF_8)) {
					String trimmed = line.trim();
					if (trimmed.isEmpty() || trimmed.startsWith("#") || !trimmed.contains("=")) {
						continue;
					}

					String[] parts = trimmed.split("=", 2);
					String key = parts[0].trim();
					String value = parts[1].trim();
					if (!key.isEmpty() && System.getProperty(key) == null && System.getenv(key) == null) {
						System.setProperty(key, value);
					}
				}
				return;
			} catch (IOException ignored) {
				// Fall back to normal Spring configuration if .env cannot be read.
			}
		}
	}

}
