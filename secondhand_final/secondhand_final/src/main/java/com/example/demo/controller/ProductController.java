package com.example.demo.controller;

import com.example.demo.model.Product;
import com.example.demo.model.Member;
import com.example.demo.model.Admin;
import com.example.demo.service.ProductService;

import jakarta.servlet.http.HttpSession; // 確保是 jakarta.servlet.http.HttpSession

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile; // 導入處理文件上傳的類別

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5500", allowCredentials = "true") 
public class ProductController {

    @Autowired
    private ProductService productService;

    // 1. 取得所有商品 (保留原樣)
    @GetMapping("/products")
    public List<Product> getAllProducts() {
        // 根據您 ProductService 的方法名，這裡應該是 listAll()
        return productService.listAll();
    }
    
    // 1.1 取得已審核商品列表 (用於首頁)
    @GetMapping("/products/approved")
    public List<Product> getApprovedProducts() {
        return productService.listApprovedProducts();
    }
    
    // 1.2 取得待審核商品列表 (用於審核頁)
    @GetMapping("/products/pending")
    public List<Product> getPendingProducts() {
        return productService.listPendingProducts();
    }
    
    // 拒絕商品端點
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
    
    // 2.1 通過 ID 取得商品詳情 (確保只能取得已審核商品)
    @GetMapping("/products/detail/{id}")
    public ResponseEntity<?> getProductById(@PathVariable long id) {
        Product product = productService.findById(id);
        if (product != null && product.isApproved()) {
            return ResponseEntity.ok(product);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // 2. 取得單一商品詳情 (保留原樣)
    @GetMapping("/products/{index}")
    public ResponseEntity<?> getProductByIndex(@PathVariable int index) {
        Product product = productService.findByIndex(index);
        if (product != null) {
            return ResponseEntity.ok(product);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // 3. 商品上架（多圖上傳核心修改）
    @PostMapping("/products")
    public ResponseEntity<?> createProduct(
            // 接收所有文字欄位
            @RequestParam("name") String name,
            @RequestParam("brand") String brand,
            @RequestParam("price") double price,
            @RequestParam("conditionLevel") String conditionLevel,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam("meetLocation") String meetLocation,
            @RequestParam("tradeTime") String tradeTime,
            // 接收多個圖片文件
            @RequestParam(value = "imageFiles", required = false) List<MultipartFile> imageFiles,
            HttpSession session
    ) {

        // 先檢查登入 (保留原邏輯)
        Member loggedInUser = (Member) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return ResponseEntity.status(401)
                .body(Map.of("message", "請先登入後再上架商品"));
        }
        
        // 呼叫 Service 層，將所有資料和文件列表傳入
        String result = productService.createProduct(
            loggedInUser, // Seller 資訊
            name,
            brand,
            price,
            conditionLevel,
            description,
            category,
            meetLocation,
            tradeTime,
            imageFiles // <--- 傳遞文件列表
        );

        if (result == null) {
            return ResponseEntity.ok(Map.of("message", "上架成功"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", result));
        }
    }
    
    // 4. 審核商品（管理員功能）
    @PostMapping("/products/{productId}/approve")
    public ResponseEntity<?> approveProduct(
            @PathVariable(name = "productId") long productId,
            HttpSession session
    ) {
        // 檢查登入
        Admin loggedInUser = (Admin) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "請先登入"));
        }
        
        // 檢查是否為管理員
        if (!(loggedInUser instanceof com.example.demo.model.Admin)) {
            return ResponseEntity.status(403)
                .body(Map.of("message", "只有管理員才能審核商品"));
        }
        
        // 呼叫 Service 層進行審核
        String result = productService.approveProduct(productId);
        
        if (result == null) {
            return ResponseEntity.ok(Map.of("message", "審核通過"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", result));
        }
    }
}