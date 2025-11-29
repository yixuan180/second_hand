package com.example.demo.service; 

import com.example.demo.repository.UserRepository;
import com.example.demo.model.User;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepo;
public AuthService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }
 
   public User login(String username, String password) {

        // 避免空字串
        if (username == null || username.isBlank() ||
            password == null || password.isBlank()) {
            return null;
        }

        
        User u = userRepo.findByUsername(username);

        if (u != null && u.getPassword().equals(password)) {
            return u;
        }
        return null;
    }
    
    
}
