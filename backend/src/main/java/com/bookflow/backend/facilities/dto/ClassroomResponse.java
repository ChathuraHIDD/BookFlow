package com.bookflow.backend.facilities.dto;

import java.util.List;

public record ClassroomResponse(
        String id,
        String roomNumber,
        int capacity,
        String type,
        List<String> equipment,
        String status) {
}
