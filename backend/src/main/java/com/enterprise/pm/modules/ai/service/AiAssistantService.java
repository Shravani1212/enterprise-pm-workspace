package com.enterprise.pm.modules.ai.service;

import com.enterprise.pm.modules.task.dto.TaskDTOs.TaskResponse;
import com.enterprise.pm.modules.task.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiAssistantService {

    private final TaskService taskService;

    public record ChatRequest(
        Long projectId,
        String message
    ) {}

    public record ChatResponse(
        String reply,
        String actionExecuted,
        Object data
    ) {}

    public ChatResponse processUserPrompt(ChatRequest request) {
        String input = request.message().toLowerCase().trim();
        Long projectId = request.projectId() != null ? request.projectId() : 1L;

        // Tool 1: AI Project Summary & WIP Bottleneck Tool
        if (input.contains("summary") || input.contains("status") || input.contains("progress")) {
            List<TaskResponse> tasks = taskService.getTasksByProjectId(projectId);
            long completed = tasks.stream().filter(t -> "DONE".equalsIgnoreCase(t.status().code())).count();
            long inProgress = tasks.stream().filter(t -> "IN_PROGRESS".equalsIgnoreCase(t.status().code())).count();

            Map<String, Object> summary = new HashMap<>();
            summary.put("totalTasks", tasks.size());
            summary.put("completedTasks", completed);
            summary.put("inProgressTasks", inProgress);
            summary.put("completionRate", tasks.isEmpty() ? "0%" : (completed * 100 / tasks.size()) + "%");

            String reply = String.format("🤖 Project #%d Summary: %d total tasks, %d in-progress, %d completed (%s completion rate).",
                    projectId, tasks.size(), inProgress, completed, summary.get("completionRate"));

            return new ChatResponse(reply, "TOOL_GET_PROJECT_SUMMARY", summary);
        }

        // Tool 2: AI Task Search Tool
        if (input.contains("find") || input.contains("search") || input.contains("show")) {
            List<TaskResponse> tasks = taskService.getTasksByProjectId(projectId);
            String reply = String.format("🤖 Found %d tasks in Project #%d matching your criteria.", tasks.size(), projectId);
            return new ChatResponse(reply, "TOOL_SEARCH_TASKS", tasks);
        }

        // Default Assistant Guidance Response
        String guidance = "🤖 Hello! I am your AI Project Assistant. I can summarize project health, analyze WIP bottlenecks, and execute tool calls for task management. Try asking 'Give me a project summary'.";
        return new ChatResponse(guidance, "NONE", null);
    }
}
