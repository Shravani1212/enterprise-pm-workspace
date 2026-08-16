package com.projectpulse.pm.common.exception;

import com.projectpulse.pm.common.api.ApiResponse;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public ResponseEntity<ApiResponse<Object>> handleError(HttpServletRequest request) {
        Object statusAttr = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Object messageAttr = request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        Object uriAttr = request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);

        int statusCode = statusAttr != null ? Integer.parseInt(statusAttr.toString()) : HttpStatus.INTERNAL_SERVER_ERROR.value();
        HttpStatus status = HttpStatus.resolve(statusCode) != null ? HttpStatus.resolve(statusCode) : HttpStatus.INTERNAL_SERVER_ERROR;

        String path = uriAttr != null ? uriAttr.toString() : request.getRequestURI();
        String message = messageAttr != null && !messageAttr.toString().isBlank()
                ? messageAttr.toString()
                : (status.getReasonPhrase() != null ? status.getReasonPhrase() : "Unexpected Error");

        ApiResponse<Object> response = ApiResponse.error(
                statusCode,
                status.name(),
                message,
                path
        );

        return new ResponseEntity<>(response, status);
    }
}
