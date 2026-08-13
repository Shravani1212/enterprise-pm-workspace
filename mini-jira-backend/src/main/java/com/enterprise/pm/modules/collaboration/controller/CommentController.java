package com.enterprise.pm.modules.collaboration.controller;

import com.enterprise.pm.common.api.ApiResponse;
import com.enterprise.pm.modules.collaboration.entity.Comment;
import com.enterprise.pm.modules.collaboration.service.ActivityLogService;
import com.enterprise.pm.security.UserPrincipal;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks/{taskId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final ActivityLogService activityLogService;

    public record CommentCreateRequest(
        @NotBlank(message = "Comment text is required")
        String content
    ) {}

    @GetMapping
    public ResponseEntity<ApiResponse<List<Comment>>> getComments(@PathVariable("taskId") Long taskId) {
        return ResponseEntity.ok(ApiResponse.success(activityLogService.getTaskComments(taskId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Comment>> addComment(@PathVariable("taskId") Long taskId,
                                                          @RequestBody CommentCreateRequest request,
                                                          @AuthenticationPrincipal UserPrincipal currentUser) {
        Comment comment = activityLogService.addComment(taskId, request.content(), currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Comment added successfully", comment));
    }
}
