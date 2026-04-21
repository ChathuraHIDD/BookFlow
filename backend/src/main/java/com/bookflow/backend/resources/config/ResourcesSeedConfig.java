package com.bookflow.backend.resources.config;

import java.time.Instant;
import java.util.List;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.bookflow.backend.resources.model.Resource;
import com.bookflow.backend.resources.model.ResourceOperationalStatus;
import com.bookflow.backend.resources.repository.ResourceRepository;

@Configuration
public class ResourcesSeedConfig {

    @Bean
    ApplicationRunner resourcesSeeder(ResourceRepository resourceRepository) {
        return args -> {
            if (resourceRepository.count() > 0) {
                return;
            }

            List<Resource> resources = List.of(
                    createResource("library-rooms", "Library Rooms", "Learning Related",
                            "Quiet rooms for study groups, tutoring sessions, and focused reading.",
                            List.of("Main Library", "Reference Wing", "Study Annex"),
                            List.of("Whiteboards", "Power outlets", "Soft seating")),
                    createResource("computer-labs", "Computer Labs", "Learning Related",
                            "Workstations for coding, design software, and technical coursework.",
                            List.of("ICT block", "Engineering lab", "Digital studio"),
                            List.of("Desktop PCs", "High-speed network", "Lab printing")),
                    createResource("science-laboratories", "Science Laboratories", "Learning Related",
                            "Controlled lab spaces for experiments, sampling, and analysis.",
                            List.of("Science faculty", "Research wing", "Chemistry block"),
                            List.of("Lab benches", "Safety gear", "Measurement kits")),
                    createResource("smart-boards", "Smart Boards", "Learning Related",
                            "Interactive teaching surfaces for collaborative classroom sessions.",
                            List.of("Teaching block", "Innovation rooms", "Faculty suites"),
                            List.of("Touch input", "Screen sharing", "Annotation tools")),
                    createResource("projectors", "Projectors", "Learning Related",
                            "Portable projection units for lectures, presentations, and demos.",
                            List.of("Lecture halls", "Seminar rooms", "Media lab"),
                            List.of("HDMI ready", "Wireless casting", "Remote controls")),
                    createResource("meeting-rooms", "Meeting Rooms", "Collaboration & Spaces",
                            "Bookable rooms for meetings, consultations, and team reviews.",
                            List.of("Admin block", "Faculty office", "Collaboration suite"),
                            List.of("Video call kit", "Conference table", "Display screen")),
                    createResource("student-lounges", "Student Lounges", "Collaboration & Spaces",
                            "Relaxed hangout spaces for social learning and downtime.",
                            List.of("Union building", "Residence lounge", "Library atrium"),
                            List.of("Soft seating", "Charging ports", "Shared screens")),
                    createResource("medical-center", "Medical Center", "Student Services",
                            "Campus health support for first aid, consultations, and referrals.",
                            List.of("Health services block", "Student support wing", "Clinic annex"),
                            List.of("First aid", "Nurse desk", "Waiting lounge")),
                    createResource("swimming-pool", "Swimming Pool", "Sports & Recreation",
                            "Recreation and training pool for lessons, fitness, and recovery.",
                            List.of("Sports complex", "Aquatics center", "Fitness campus"),
                            List.of("Lifeguard support", "Lane booking", "Changing rooms")),
                    createResource("tennis-court", "Tennis Court", "Sports & Recreation",
                            "Outdoor court space for practice, matches, and coaching sessions.",
                            List.of("Outdoor sports park", "Recreation field", "Club court"),
                            List.of("Floodlights", "Equipment rack", "Spectator seating")),
                    createResource("gym", "Gym", "Sports & Recreation",
                            "Fitness room with strength, cardio, and conditioning equipment.",
                            List.of("Fitness center", "Wellness block", "Sports complex"),
                            List.of("Cardio machines", "Weights area", "Trainer desk"))
            );

            resourceRepository.saveAll(resources);
        };
    }

    private Resource createResource(String slug, String name, String category, String description,
                                    List<String> locations, List<String> equipment) {
        Resource resource = new Resource();
        resource.setSlug(slug);
        resource.setName(name);
        resource.setCategory(category);
        resource.setDescription(description);
        resource.setLocations(locations);
        resource.setEquipment(equipment);
        resource.setOperationalStatus(ResourceOperationalStatus.AVAILABLE);
        resource.setCreatedAt(Instant.now());
        return resource;
    }
}
