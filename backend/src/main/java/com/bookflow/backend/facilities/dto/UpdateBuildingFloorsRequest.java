package com.bookflow.backend.facilities.dto;

import jakarta.validation.constraints.Min;

public class UpdateBuildingFloorsRequest {

    @Min(1)
    private int floorCount;

    public int getFloorCount() {
        return floorCount;
    }

    public void setFloorCount(int floorCount) {
        this.floorCount = floorCount;
    }
}
