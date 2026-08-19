package com.projectpulse.pm.modules.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaptchaService {

    @Value("${app.captcha.enabled:false}")
    private boolean captchaEnabled;

    @Value("${app.captcha.secret-key:}")
    private String captchaSecretKey;

    @Value("${app.captcha.verify-url:https://www.google.com/recaptcha/api/siteverify}")
    private String captchaVerifyUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean verifyCaptcha(String token, String ipAddress) {
        if (!captchaEnabled) {
            return true;
        }

        if (token == null || token.isBlank()) {
            log.warn("Captcha token is missing");
            return false;
        }

        try {
            MultiValueMap<String, String> requestMap = new LinkedMultiValueMap<>();
            requestMap.add("secret", captchaSecretKey);
            requestMap.add("response", token);
            if (ipAddress != null && !ipAddress.isBlank()) {
                requestMap.add("remoteip", ipAddress);
            }

            ResponseEntity<Map> response = restTemplate.postForEntity(captchaVerifyUrl, requestMap, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && Boolean.TRUE.equals(body.get("success"))) {
                return true;
            } else {
                log.warn("Captcha verification failed: {}", body);
                return false;
            }
        } catch (Exception e) {
            log.error("Error communicating with Captcha provider", e);
            return false;
        }
    }
}
