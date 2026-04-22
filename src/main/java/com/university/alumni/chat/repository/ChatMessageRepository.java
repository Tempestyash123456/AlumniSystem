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

    @Query(value = "SELECT u.* FROM users u " +
           "JOIN ( " +
           "    SELECT " +
           "        CASE WHEN sender_id = :userId THEN recipient_id ELSE sender_id END as contact_id, " +
           "        MAX(created_at) as last_msg_at " +
           "    FROM chat_messages " +
           "    WHERE sender_id = :userId OR recipient_id = :userId " +
           "    GROUP BY contact_id " +
           ") last_msgs ON u.id = last_msgs.contact_id " +
           "WHERE u.deleted_at IS NULL " +
           "ORDER BY last_msgs.last_msg_at DESC", nativeQuery = true)
    List<User> findConversations(@Param("userId") UUID userId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.recipient.id = :recipientId AND m.sender.id = :senderId AND m.isRead = false")
    long countUnreadMessages(@Param("recipientId") UUID recipientId, @Param("senderId") UUID senderId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.recipient.id = :recipientId AND m.sender.id = :senderId AND m.isRead = false")
    void markAsRead(@Param("recipientId") UUID recipientId, @Param("senderId") UUID senderId);

    @Query("SELECT m FROM ChatMessage m WHERE (m.sender.id = :u1 AND m.recipient.id = :u2) OR (m.sender.id = :u2 AND m.recipient.id = :u1) ORDER BY m.createdAt DESC LIMIT 1")
    ChatMessage findLatestMessage(@Param("u1") UUID u1, @Param("u2") UUID u2);
}
