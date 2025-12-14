package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;


import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry; 

@Configuration
public class SecurityConfig {

    
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://127.0.0.1:5500") 
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowCredentials(true)
                        .allowedHeaders("*");
            }
            
           
            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
    
                registry.addResourceHandler("/uploads/**")
                        
                        .addResourceLocations("file:./uploads/"); 
            }
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            .cors(cors -> {})  
            .csrf(csrf -> csrf.disable()) 
            .authorizeHttpRequests(auth -> auth
                
                .requestMatchers("/api/login", "/api/check-login", "/uploads/**").permitAll() 
                .anyRequest().permitAll()
            )
            .logout(logout -> logout.logoutUrl("/api/logout"));

        return http.build();
    }
}