package com.university.alumni.post.repository;

import com.university.alumni.post.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

    @Query("SELECT p FROM Post p JOIN FETCH p.author WHERE p.deletedAt IS NULL ORDER BY p.createdAt DESC")
    List<Post> findAllActive();

    @Query("SELECT p FROM Post p JOIN FETCH p.author WHERE p.author.id = :authorId AND p.deletedAt IS NULL ORDER BY p.createdAt DESC")
    List<Post> findByAuthorId(UUID authorId);
}