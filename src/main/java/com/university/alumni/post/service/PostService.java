package com.university.alumni.post.service;

import com.university.alumni.common.exception.ResourceNotFoundException;
import com.university.alumni.common.service.FileStorageService;
import com.university.alumni.post.dto.PostDtos.*;
import com.university.alumni.post.entity.Post;
import com.university.alumni.post.repository.PostRepository;
import com.university.alumni.user.entity.User;
import com.university.alumni.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository      postRepository;
    private final UserRepository      userRepository;
    private final FileStorageService  fileStorageService;

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
    public PostResponse createPost(UUID authorId, CreatePostRequest request, MultipartFile image) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authorId));

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = fileStorageService.storePostImage(image);
        }

        Post post = Post.builder()
                .title(request.title())
                .description(request.description())
                .imageUrl(imageUrl)
                .author(author)
                .build();

        return toResponse(postRepository.save(post));
    }

    @Transactional
    public PostResponse updatePost(UUID postId, UpdatePostRequest request, MultipartFile image) {
        Post post = findOrThrow(postId);

        if (request.title()       != null && !request.title().isBlank())       post.setTitle(request.title());
        if (request.description() != null && !request.description().isBlank()) post.setDescription(request.description());

        if (Boolean.TRUE.equals(request.removeImage())) {
            post.setImageUrl(null);
        } else if (image != null && !image.isEmpty()) {
            post.setImageUrl(fileStorageService.storePostImage(image));
        }

        return toResponse(postRepository.save(post));
    }

    @Transactional
    public void deletePost(UUID postId) {
        Post post = findOrThrow(postId);
        post.softDelete();
        postRepository.save(post);
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
                post.getImageUrl(),
                author.getFirstName(),
                author.getLastName(),
                author.getProfilePhotoUrl(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}