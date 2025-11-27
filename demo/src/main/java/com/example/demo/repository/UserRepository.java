package com.example.demo.repository; 

import com.example.demo.model.User; 

import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.List;

@Repository
public class UserRepository {
    private List<User> users = new ArrayList<>();


    public UserRepository() {
        users.add(new User("test", "1234"));
    }

   
    public User findByUsername(String username) {
        for (User u : users) {
            if (u.getUsername().equals(username)) {
                return u; 
            }
        }
        return null; 
    }//依帳號找使用者

    public void save(User user) {
        users.add(user);
    }//新增使用者
}
