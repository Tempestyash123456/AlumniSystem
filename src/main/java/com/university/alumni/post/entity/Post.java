package com.university.alumni.post.entity;

import com.university.alumni.common.entity.BaseEntity;
import com.university.alumni.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

/**
 * Admin-authored blog post.
 * description field stores raw Markdown — rendered on the frontend.
 */
@Entity
@Table(name = "posts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Post extends BaseEntity {

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;   // Markdown content

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;
}