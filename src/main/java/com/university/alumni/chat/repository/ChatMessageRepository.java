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

    @Query("SELECT m FROM ChatMessage m WHERE (m.sender = :u1 AND m.recipient = :u2) OR (m.sender = :u2 AND m.recipient = :u1) ORDER BY m.createdAt ASC")
    List<ChatMessage> findChatHistory(@Param("u1") User u1, @Param("u2") User u2);

    @Query("SELECT DISTINCT m.recipient FROM ChatMessage m WHERE m.sender = :user " +
           "UNION " +
           "SELECT DISTINCT m.sender FROM ChatMessage m WHERE m.recipient = :user")
    List<User> findConversations(@Param("user") User user);
}
