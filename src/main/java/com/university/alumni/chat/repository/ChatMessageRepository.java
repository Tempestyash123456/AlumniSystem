package com.university.alumni.chat.repository;

import com.university.alumni.chat.entity.ChatMessage;
import com.university.alumni.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    long countBySenderAndRecipient(User sender, User recipient);

    @Query("SELECT m FROM ChatMessage m JOIN FETCH m.sender JOIN FETCH m.recipient WHERE (m.sender = :u1 AND m.recipient = :u2) OR (m.sender = :u2 AND m.recipient = :u1) ORDER BY m.createdAt ASC")
    List<ChatMessage> findChatHistory(@Param("u1") User u1, @Param("u2") User u2);

    @Query(value = "SELECT DISTINCT u.* FROM users u " +
           "JOIN chat_messages m ON (u.id = m.recipient_id AND m.sender_id = :userId) " +
           "OR (u.id = m.sender_id AND m.recipient_id = :userId) " +
           "WHERE u.deleted_at IS NULL", nativeQuery = true)
    List<User> findConversations(@Param("userId") UUID userId);
}
