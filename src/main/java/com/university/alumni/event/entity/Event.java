package com.university.alumni.event.entity;

import com.university.alumni.common.entity.BaseEntity;
import com.university.alumni.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "events")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Event extends BaseEntity {

    @Column(nullable = false, length = 300)
    private String name;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Column(nullable = false, length = 500)
    private String place;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Collection of media: URL and Type (IMAGE | VIDEO) */
    @ElementCollection
    @CollectionTable(name = "event_media", joinColumns = @JoinColumn(name = "event_id"))
    private java.util.List<EventMedia> media;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventMedia {
        @Column(name = "url", length = 500)
        private String url;

        @Column(name = "type", length = 20)
        private String type; // "IMAGE" | "VIDEO"
    }


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;
}