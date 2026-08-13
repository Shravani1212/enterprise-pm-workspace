package com.enterprise.pm.modules.ai.controller;

import com.enterprise.pm.common.api.ApiResponse;
import com.enterprise.pm.modules.ai.service.AiAssistantService;
import com.enterprise.pm.modules.ai.service.AiAssistantService.ChatRequest;
import com.enterprise.pm.modules.ai.service.AiAssistantService.ChatResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> processChat(@RequestBody ChatRequest request) {
        return ResponseEntity.ok(ApiResponse.success(aiAssistantService.processUserPrompt(request)));
    }
}
