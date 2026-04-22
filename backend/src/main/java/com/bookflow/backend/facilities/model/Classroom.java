package com.bookflow.backend.facilities.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "classrooms")
public class Classroom {

    @Id
    private String id;

    @Indexed
    private String buildingId;

    private String buildingName;

    private int floorNumber;

    private String roomNumber;

    private int capacity;

    private String type;

    private List<String> equipment = new ArrayList<>();

    private boolean seatSelectionEnabled = true;

    private FacilityOperationalStatus operationalStatus = FacilityOperationalStatus.AVAILABLE;

    private Instant createdAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBuildingId() {
        return buildingId;
    }

    public void setBuildingId(String buildingId) {
        this.buildingId = buildingId;
    }

    public String getBuildingName() {
        return buildingName;
    }

    public void setBuildingName(String buildingName) {
        this.buildingName = buildingName;
    }

    public int getFloorNumber() {
        return floorNumber;
    }

    public void setFloorNumber(int floorNumber) {
        this.floorNumber = floorNumber;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List<String> getEquipment() {
        return equipment;
    }

    public void setEquipment(List<String> equipment) {
        this.equipment = equipment;
    }

    public boolean isSeatSelectionEnabled() {
        return seatSelectionEnabled;
    }

    public void setSeatSelectionEnabled(boolean seatSelectionEnabled) {
        this.seatSelectionEnabled = seatSelectionEnabled;
    }

    public FacilityOperationalStatus getOperationalStatus() {
        return operationalStatus;
    }

    public void setOperationalStatus(FacilityOperationalStatus operationalStatus) {
        this.operationalStatus = operationalStatus;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
