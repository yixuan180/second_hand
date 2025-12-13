// src/main/java/com/example/demo/config/SecurityConfig.java
package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

// *** 新增此匯入 ***
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry; 

@Configuration
public class SecurityConfig {

    // 1. 全域 CORS 設定和資源處理器
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://127.0.0.1:5500") // 前端 Live Server (保持原樣)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowCredentials(true)
                        .allowedHeaders("*");
            }
            
            // 2. *** 新增：配置資源處理器，映射 /uploads/ 到圖片儲存目錄 ***
            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                // 配置 /uploads/** 的 URL 路徑，使其指向專案根目錄下的 uploads 資料夾
                registry.addResourceHandler("/uploads/**")
                        // 注意：這裡的路徑要與 application.properties 中的路徑一致
                        .addResourceLocations("file:./uploads/"); 
            }
        };
    }

    // 3. Spring Security 設定 (保持原樣)
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            .cors(cors -> {})   // 啟用 CORS
            .csrf(csrf -> csrf.disable()) // 用 API 的話禁用 CSRF
            .authorizeHttpRequests(auth -> auth
                // 允許未登入訪問圖片資源
                .requestMatchers("/api/login", "/api/check-login", "/uploads/**").permitAll() 
                .anyRequest().permitAll()
            )
            .logout(logout -> logout.logoutUrl("/api/logout"));

        return http.build();
    }
}