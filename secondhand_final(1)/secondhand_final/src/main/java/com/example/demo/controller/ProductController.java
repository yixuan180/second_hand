package com.example.demo.controller;

import com.example.demo.model.Product;
import com.example.demo.model.Member;
import com.example.demo.model.Admin;
import com.example.demo.service.ProductService;

import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5500", allowCredentials = "true") 
public class ProductController {

    @Autowired
    private ProductService productService;

    
    @GetMapping("/products")
    public List<Product> getAllProducts() {
    
        return productService.listAll();
    }
    
    @GetMapping("/products/approved")
    public List<Product> getApprovedProducts() {
        return productService.listApprovedProducts();
    }
    
    @GetMapping("/products/pending")
    public List<Product> getPendingProducts() {
        return productService.listPendingProducts();
    }
   
    @PostMapping("/products/{productId}/reject")
    public ResponseEntity<?> rejectProduct(
            @PathVariable(name = "productId") long productId,
            @RequestBody Map<String, String> requestBody,
            HttpSession session) {
        
        Admin loggedInUser = (Admin) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "請先登入"));
        }
        
        if (!(loggedInUser instanceof com.example.demo.model.Admin)) {
            return ResponseEntity.status(403).body(Map.of("message", "只有管理員才能拒絕商品"));
        }
        
        String reason = requestBody.get("reason");
        if (reason == null || reason.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "拒絕原因不能為空"));
        }
        
        Product product = productService.findById(productId);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        
        productService.rejectProduct(productId, reason);
        return ResponseEntity.ok(Map.of("message", "商品已拒絕", "productId", productId, "productName", product.getName(), "reason", reason));
    }
    
    
    @GetMapping("/products/detail/{id}")
    public ResponseEntity<?> getProductById(@PathVariable long id) {
        Product product = productService.findById(id);
        if (product != null && product.isApproved()) {
            return ResponseEntity.ok(product);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    
    @GetMapping("/products/{index}")
    public ResponseEntity<?> getProductByIndex(@PathVariable int index) {
        Product product = productService.findByIndex(index);
        if (product != null) {
            return ResponseEntity.ok(product);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/products")
    public ResponseEntity<?> createProduct(
           
            @RequestParam("name") String name,
            @RequestParam("brand") String brand,
            @RequestParam("price") double price,
            @RequestParam("conditionLevel") String conditionLevel,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam("meetLocation") String meetLocation,
            @RequestParam("tradeTime") String tradeTime,
           
            @RequestParam(value = "imageFiles", required = false) List<MultipartFile> imageFiles,
            HttpSession session
    ) {

        Member loggedInUser = (Member) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return ResponseEntity.status(401)
                .body(Map.of("message", "請先登入後再上架商品"));
        }
        
        String result = productService.createProduct(
            loggedInUser, 
            name,
            brand,
            price,
            conditionLevel,
            description,
            category,
            meetLocation,
            tradeTime,
            imageFiles 
        );

        if (result == null) {
            return ResponseEntity.ok(Map.of("message", "上架成功"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", result));
        }
    }
    
   
    @PostMapping("/products/{productId}/approve")
    public ResponseEntity<?> approveProduct(
            @PathVariable(name = "productId") long productId,
            HttpSession session
    ) {
        
        Admin loggedInUser = (Admin) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "請先登入"));
        }
        
        
        if (!(loggedInUser instanceof com.example.demo.model.Admin)) {
            return ResponseEntity.status(403)
                .body(Map.of("message", "只有管理員才能審核商品"));
        }
        
        
        String result = productService.approveProduct(productId);
        
        if (result == null) {
            return ResponseEntity.ok(Map.of("message", "審核通過"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", result));
        }
    }
}