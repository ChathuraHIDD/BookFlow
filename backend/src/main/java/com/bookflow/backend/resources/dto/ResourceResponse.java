package com.bookflow.backend.resources.dto;

import java.util.List;

public class ResourceResponse {

    private String id;
    private String slug;
    private String name;
    private String category;
    private String description;
    private List<String> locations;
    private List<String> equipment;
    private String operationalStatus;

    public ResourceResponse(String id, String slug, String name, String category, String description,
                            List<String> locations, List<String> equipment, String operationalStatus) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.category = category;
        this.description = description;
        this.locations = locations;
        this.equipment = equipment;
        this.operationalStatus = operationalStatus;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getLocations() {
        return locations;
    }

    public void setLocations(List<String> locations) {
        this.locations = locations;
    }

    public List<String> getEquipment() {
        return equipment;
    }

    public void setEquipment(List<String> equipment) {
        this.equipment = equipment;
    }

    public String getOperationalStatus() {
        return operationalStatus;
    }

    public void setOperationalStatus(String operationalStatus) {
        this.operationalStatus = operationalStatus;
    }
}
