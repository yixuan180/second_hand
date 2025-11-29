package com.example.demo.controller;

import com.example.demo.model.Product;
import com.example.demo.model.User;
import com.example.demo.service.ProductService;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5500", allowCredentials = "true") 
public class ProductController {

    @Autowired
    private ProductService productService;

    // 1. 取得所有商品
    @GetMapping("/products")
    public List<Product> getAllProducts() {
        return productService.listAll();
    }

    // 2. 取得單一商品詳情
    @GetMapping("/products/{index}")
    public ResponseEntity<?> getProductByIndex(@PathVariable int index) {
        Product product = productService.findByIndex(index);
        if (product != null) {
            return ResponseEntity.ok(product);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // 3. 商品上架（需要登入）
    @PostMapping("/products")
    public ResponseEntity<?> createProduct(
            @RequestBody Product product,
            HttpSession session
    ) {

        // 先檢查登入
        User loggedInUser = (User) session.getAttribute("loggedInUser");

        if (loggedInUser == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "請先登入後再上架商品"));
        }

        // 強制使用 session 內的使用者為 seller（阻止前端偽造 seller）
        product.setSeller(loggedInUser);

        String result = productService.createProduct(
                loggedInUser,
                product.getName(),
                product.getBrand(),
                product.getPrice(),
                product.getConditionLevel(),
                product.getDescription(),
                product.getCategory(),
                product.getMeetLocation(),
                product.getImagePaths()
        );

        if (result == null) {
            return ResponseEntity.ok(Map.of("message", "上架成功"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", result));
        }
    }
}
