package com.university.alumni.chat.controller;

import com.university.alumni.chat.dto.ChatDtos.*;
import com.university.alumni.chat.service.ChatService;
import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.security.model.CachedUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<ChatMessageDto>> sendMessage(
            @AuthenticationPrincipal CachedUserDetails currentUser,
            @RequestBody SendMessageRequest request) {
        
        var message = chatService.sendMessage(currentUser.getId(), request.getRecipientId(), request.getContent());
        
        return ResponseEntity.ok(ApiResponse.success(mapToDto(message)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getHistory(
            @AuthenticationPrincipal CachedUserDetails currentUser,
            @RequestParam UUID userId) {
        
        var history = chatService.getChatHistory(currentUser.getId(), userId);
        var dtos = history.stream().map(this::mapToDto).collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationDto>>> getConversations(
            @AuthenticationPrincipal CachedUserDetails currentUser) {
        
        var users = chatService.getConversations(currentUser.getId());
        var dtos = users.stream().map(u -> ConversationDto.builder()
                .userId(u.getId())
                .userName(u.getFirstName() + " " + u.getLastName())
                .profilePhotoUrl(u.getProfilePhotoUrl())
                .build()).collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getNotifications(
            @AuthenticationPrincipal CachedUserDetails currentUser) {
        
        var notifications = chatService.getNotifications(currentUser.getId());
        var dtos = notifications.stream().map(n -> NotificationDto.builder()
                .id(n.getId())
                .message(n.getMessage())
                .link(n.getLink())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build()).collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable UUID id) {
        chatService.markNotificationAsRead(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private ChatMessageDto mapToDto(com.university.alumni.chat.entity.ChatMessage message) {
        return ChatMessageDto.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFirstName() + " " + message.getSender().getLastName())
                .recipientId(message.getRecipient().getId())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
