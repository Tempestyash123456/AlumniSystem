package com.university.alumni.chat.service;

import com.university.alumni.chat.entity.ChatMessage;
import com.university.alumni.chat.entity.Notification;
import com.university.alumni.chat.repository.ChatMessageRepository;
import com.university.alumni.chat.repository.NotificationRepository;
import com.university.alumni.common.exception.BadRequestException;
import com.university.alumni.common.exception.ResourceNotFoundException;
import com.university.alumni.user.entity.User;
import com.university.alumni.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChatMessage sendMessage(UUID senderId, UUID recipientId, String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new BadRequestException("Message content cannot be empty");
        }
        if (content.length() > 100) {
            throw new BadRequestException("Message exceeds 100 characters");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));

        // Enforce 3-message limit
        long sentCount = chatMessageRepository.countBySenderAndRecipient(sender, recipient);
        if (sentCount >= 3) {
            throw new BadRequestException("You have reached the limit of 3 messages for this user.");
        }

        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .recipient(recipient)
                .content(content.trim())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);

        // Create notification
        Notification notification = Notification.builder()
                .recipient(recipient)
                .message("You received a new message from " + sender.getFirstName() + " " + sender.getLastName())
                .link("/chat?userId=" + sender.getId())
                .build();
        notificationRepository.save(notification);

        return saved;
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getChatHistory(UUID user1Id, UUID user2Id) {
        User u1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User u2 = userRepository.findById(user2Id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return chatMessageRepository.findChatHistory(u1, u2);
    }

    @Transactional(readOnly = true)
    public List<User> getConversations(UUID userId) {
        return chatMessageRepository.findConversations(userId);
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotifications(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
    }

    @Transactional
    public void markNotificationAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }
}
