package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.AuthService;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5500", allowCredentials = "true")
public class LoginController {

    @Autowired
    private AuthService authService;


    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> loginData,
            HttpSession session
    ) {
        String username = loginData.get("username");
        String password = loginData.get("password");

        User user = authService.login(username, password);

        if (user != null) {

            // 記錄登入狀態到 session
            session.setAttribute("loggedInUser", user);

            return ResponseEntity.ok(
                    Map.of(
                            "message", "Login Success",
                            "username", user.getUsername()
                    )
            );
        } else {
            return ResponseEntity.status(401).body(Map.of("message", "帳號或密碼錯誤"));
        }
    }


    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Logout Success"));
    }


    @GetMapping("/check-login")
    public ResponseEntity<?> checkLogin(HttpSession session) {
        User user = (User) session.getAttribute("loggedInUser");
        if (user != null) {
            return ResponseEntity.ok(Map.of("loggedIn", true, "username", user.getUsername()));
        } else {
            return ResponseEntity.ok(Map.of("loggedIn", false));
        }
    }

}
