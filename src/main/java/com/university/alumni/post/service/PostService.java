package com.university.alumni.post.service;

import com.university.alumni.audit.service.AuditLogService;
import com.university.alumni.common.exception.ResourceNotFoundException;
import com.university.alumni.common.service.FileStorageService;
import com.university.alumni.post.dto.PostDtos.*;
import com.university.alumni.post.entity.Post;
import com.university.alumni.post.repository.PostRepository;
import com.university.alumni.user.entity.User;
import com.university.alumni.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository      postRepository;
    private final UserRepository      userRepository;
    private final FileStorageService  fileStorageService;
    private final AuditLogService     auditLogService;

    @Transactional(readOnly = true)
    public List<PostResponse> getAllPosts() {
        return postRepository.findAllActive().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PostResponse getPost(UUID postId) {
        return toResponse(findOrThrow(postId));
    }

    @Transactional
    public PostResponse createPost(UUID authorId, CreatePostRequest request, List<MultipartFile> images) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authorId));

        java.util.List<String> imageUrls = new java.util.ArrayList<>();
        if (images != null && !images.isEmpty()) {
            for (MultipartFile image : images) {
                if (image != null && !image.isEmpty()) {
                    imageUrls.add(fileStorageService.storePostImage(image));
                }
            }
        }

        Post post = Post.builder()
                .title(request.title())
                .description(request.description())
                .imageUrls(imageUrls)
                .author(author)
                .build();

        PostResponse saved = toResponse(postRepository.save(post));
        auditLogService.record("CREATED_POST", author.getFirstName(), author.getLastName(), post.getTitle());
        return saved;
    }

    @Transactional
    public PostResponse updatePost(UUID postId, UpdatePostRequest request, List<MultipartFile> images) {
        Post post = findOrThrow(postId);

        if (request.title()       != null && !request.title().isBlank())       post.setTitle(request.title());
        if (request.description() != null && !request.description().isBlank()) post.setDescription(request.description());

        if (Boolean.TRUE.equals(request.removeImage())) {
            post.setImageUrls(new java.util.ArrayList<>());
        } else if (images != null && !images.isEmpty()) {
            java.util.List<String> newUrls = new java.util.ArrayList<>();
            for (MultipartFile image : images) {
                if (image != null && !image.isEmpty()) {
                    newUrls.add(fileStorageService.storePostImage(image));
                }
            }
            // For now, let's just replace the entire list if new images are provided.
            // Or we could append. User said "upload multiple images", so replacing seems safer for "update".
            post.setImageUrls(newUrls);
        }

        PostResponse saved = toResponse(postRepository.save(post));
        User author = post.getAuthor();
        auditLogService.record("UPDATED_POST", author.getFirstName(), author.getLastName(), post.getTitle());
        return saved;
    }

    @Transactional
    public void deletePost(UUID postId) {
        Post post = findOrThrow(postId);
        String title = post.getTitle();
        User author = post.getAuthor();
        post.softDelete();
        postRepository.save(post);
        auditLogService.record("DELETED_POST", author.getFirstName(), author.getLastName(), title);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Post findOrThrow(UUID postId) {
        return postRepository.findById(postId)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postId));
    }

    private PostResponse toResponse(Post post) {
        User author = post.getAuthor();
        return new PostResponse(
                post.getId(),
                post.getTitle(),
                post.getDescription(),
                post.getImageUrls(),
                author.getFirstName(),
                author.getLastName(),
                author.getProfilePhotoUrl(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}