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

    /** Relative URL: /uploads/events/img_xxx.jpg  or absolute Google URL */
    @Column(name = "media_url", length = 500)
    private String mediaUrl;

    /** "IMAGE" | "VIDEO" */
    @Column(name = "media_type", length = 20)
    private String mediaType;

    /** Relative URL: /uploads/events/docs/doc_xxx.pdf */
    @Column(name = "document_url", length = 500)
    private String documentUrl;

    /** Original filename, so the browser can show it nicely */
    @Column(name = "document_name", length = 255)
    private String documentName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;
}