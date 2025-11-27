package com.example.demo.controller; 

import com.example.demo.model.User;
import com.example.demo.service.AuthService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // 重要！允許前端(不同 port)呼叫
public class LoginController {

    @Autowired
    private AuthService authService;

    // 定義登入的 API: POST /api/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        String username = loginData.get("username");
        String password = loginData.get("password");

        User user = authService.login(username, password);

        if (user != null) {
            // 登入成功，回傳 JSON
            return ResponseEntity.ok(Map.of("message", "Login Success", "username", user.getUsername()));
        } else {
            // 登入失敗，回傳 401 狀態碼
            return ResponseEntity.status(401).body(Map.of("message", "帳號或密碼錯誤"));
        }
    }
}