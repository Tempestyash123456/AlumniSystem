package com.university.alumni.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

public class ChatDtos {

    @Data
    public static class SendMessageRequest {
        private UUID recipientId;
        private String content;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessageDto {
        private UUID id;
        private UUID senderId;
        private String senderName;
        private UUID recipientId;
        private String content;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationDto {
        private UUID id;
        private String message;
        private String link;
        private boolean read;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversationDto {
        private UUID userId;
        private String userName;
        private String profilePhotoUrl;
    }
}
