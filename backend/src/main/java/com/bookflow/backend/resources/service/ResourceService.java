package com.bookflow.backend.resources.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bookflow.backend.resources.dto.ResourceResponse;
import com.bookflow.backend.resources.model.Resource;
import com.bookflow.backend.resources.repository.ResourceBookingRepository;
import com.bookflow.backend.resources.repository.ResourceRepository;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceBookingRepository resourceBookingRepository;

    public ResourceService(ResourceRepository resourceRepository, ResourceBookingRepository resourceBookingRepository) {
        this.resourceRepository = resourceRepository;
        this.resourceBookingRepository = resourceBookingRepository;
    }

    public List<ResourceResponse> getAllResources() {
        return resourceRepository.findAll().stream()
                .map(this::toResourceResponse)
                .collect(Collectors.toList());
    }

    public List<ResourceResponse> getResourcesByCategory(String category) {
        return resourceRepository.findByCategory(category).stream()
                .map(this::toResourceResponse)
                .collect(Collectors.toList());
    }

    public ResourceResponse getResourceById(String id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));
        return toResourceResponse(resource);
    }

    public ResourceResponse getResourceBySlug(String slug) {
        Resource resource = resourceRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));
        return toResourceResponse(resource);
    }

    private ResourceResponse toResourceResponse(Resource resource) {
        return new ResourceResponse(
                resource.getId(),
                resource.getSlug(),
                resource.getName(),
                resource.getCategory(),
                resource.getDescription(),
                resource.getLocations(),
                resource.getEquipment(),
                resource.getOperationalStatus() != null ? resource.getOperationalStatus().name() : "UNKNOWN"
        );
    }
}
