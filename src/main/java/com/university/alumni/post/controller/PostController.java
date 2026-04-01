package com.university.alumni.post.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.alumni.common.dto.ApiResponse;
import com.university.alumni.post.dto.PostDtos.*;
import com.university.alumni.post.service.PostService;
import com.university.alumni.security.model.CachedUserDetails;
import com.university.alumni.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * POST /api/v1/posts         — list all (authenticated users)
 * POST /api/v1/posts/create  — create (POST_CREATE)
 * PUT  /api/v1/posts/{id}    — update (POST_EDIT)
 * DELETE /api/v1/posts/{id}  — soft-delete (POST_DELETE)
 */
@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService  postService;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PostResponse>>> getAll(
            @AuthenticationPrincipal CachedUserDetails currentUser) {
        SecurityUtils.validateAccountActive(currentUser);
        return ResponseEntity.ok(ApiResponse.success(postService.getAllPosts()));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> getOne(
            @PathVariable UUID postId,
            @AuthenticationPrincipal CachedUserDetails currentUser) {
        SecurityUtils.validateAccountActive(currentUser);
        return ResponseEntity.ok(ApiResponse.success(postService.getPost(postId)));
    }

    /**
     * Accepts multipart/form-data:
     *  - data : JSON string of CreatePostRequest
     *  - image: (optional) image file
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('POST_CREATE')")
    public ResponseEntity<ApiResponse<PostResponse>> create(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal CachedUserDetails currentUser) throws Exception {

        CreatePostRequest request = objectMapper.readValue(dataJson, CreatePostRequest.class);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(postService.createPost(currentUser.getId(), request, image)));
    }

    @PutMapping(value = "/{postId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('POST_EDIT')")
    public ResponseEntity<ApiResponse<PostResponse>> update(
            @PathVariable UUID postId,
            @RequestPart("data") String dataJson,
            @RequestPart(value = "image", required = false) MultipartFile image) throws Exception {

        UpdatePostRequest request = objectMapper.readValue(dataJson, UpdatePostRequest.class);
        return ResponseEntity.ok(ApiResponse.success(postService.updatePost(postId, request, image)));
    }

    @DeleteMapping("/{postId}")
    @PreAuthorize("hasAuthority('POST_DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID postId) {
        postService.deletePost(postId);
        return ResponseEntity.ok(ApiResponse.success());
    }
}