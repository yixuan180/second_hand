package com.example.demo.repository; 

import com.example.demo.model.User;
import com.example.demo.model.Member;
import com.example.demo.model.Admin;

import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.List;

@Repository
public class UserRepository {
    private List<User> users = new ArrayList<>();


    public UserRepository() {
        users.add(new Member("test", "1234"));
        users.add(new Admin("admin", "1234")); 
    }

   
    public User findByUsername(String username) {
        for (User u : users) {
            if (u.getUsername().equals(username)) {
                return u; 
            }
        }
        return null; 
    }

    public void save(User user) {
        users.add(user);
    }
}
