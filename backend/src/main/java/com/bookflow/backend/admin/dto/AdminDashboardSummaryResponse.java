package com.bookflow.backend.admin.dto;

public record AdminDashboardSummaryResponse(
        long totalUsers,
        long totalStudents,
        long totalStaffMembers,
        long totalLibrarians,
        long totalAdmins) {
}
