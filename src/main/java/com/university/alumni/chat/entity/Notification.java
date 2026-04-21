package com.university.alumni.chat.entity;

import com.university.alumni.common.entity.BaseEntity;
import com.university.alumni.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

/**
 * Entity for storing notifications for users.
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private String link;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean read = false;
}
