// src/main/java/com/example/demo/service/ProductService.java
package com.example.demo.service;

import com.example.demo.repository.ProductRepository;
import com.example.demo.model.Product;
import com.example.demo.model.Member;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID; // 導入 UUID
import java.nio.file.StandardCopyOption; // 導入 StandardCopyOption

@Service
public class ProductService {

    // 保持原本的 repository 變數名稱 productRepo
    private final ProductRepository productRepo; 

    @Value("${upload.path}") // 注入在 application.properties 中定義的上傳路徑
    private String uploadPath;

    public ProductService(ProductRepository productRepo) {
        this.productRepo = productRepo;
    }

    // 取得所有商品列表 (保持原本的 listAll 或 findAll 方法)
    public List<Product> listAll() {
        return productRepo.findAll();
    }
    
    // 取得待審核商品列表
    public List<Product> listPendingProducts() {
        List<Product> all = productRepo.findAll();
        List<Product> pending = new ArrayList<>();
        for (Product p : all) {
            if ("PENDING".equals(p.getStatus())) {
                pending.add(p);
            }
        }
        return pending;
    }
    
    // 拒絕商品
    public void rejectProduct(long productId, String reason) {
        Product product = productRepo.findById(productId);
        if (product != null) {
            product.setStatus("REJECTED");
            product.setRejectionReason(reason);
            product.setApproved(false);
            productRepo.save(product);
        }
    }
    
    // 批准商品
    public void approveProductNew(long productId) {
        Product product = productRepo.findById(productId);
        if (product != null) {
            product.setStatus("APPROVED");
            product.setApproved(true);
            productRepo.save(product);
        }
    }
    
    // 取得已審核商品列表 (用於首頁和詳細頁)
    public List<Product> listApprovedProducts() {
        List<Product> all = productRepo.findAll();
        List<Product> approved = new ArrayList<>();
        for (Product p : all) {
            if (p.isApproved()) {
                approved.add(p);
            }
        }
        return approved;
    }
    
    // 取得單一商品詳情 (保持原本的 findByIndex 方法)
    public Product findByIndex(int index) {
        return productRepo.findByIndex(index);
    }
    
    // 根據 ID 取得單一商品
    public Product findById(long id) {
        return productRepo.findById(id);
    }

    // *** 這是核心修改：將 createProduct 參數改為接收 List<MultipartFile>，並整合文件上傳邏輯 ***
        public String createProduct(
            Member seller,
            String name,
            String brand,
            double price,
            String conditionLevel,
            String description,
            String category,
            String meetLocation,
            String tradeTime,
            List<MultipartFile> imageFiles // <--- 修改為接收 List<MultipartFile>
    ) {

        // 1. 必填欄位檢查 (保留原有邏輯)
        if (seller == null) return "賣家資訊錯誤（尚未登入）";
        if (name == null || name.isBlank()) return "商品名稱為必填";
        if (price <= 0) return "價格必須大於 0";
        if (conditionLevel == null || conditionLevel.isBlank()) return "商品狀況必填";
        if (description == null || description.isBlank()) return "商品描述為必填";
        if (category == null || category.isBlank()) return "請選擇商品分類";
        if (meetLocation == null || meetLocation.isBlank()) return "交易地點為必填";
        if (tradeTime == null || tradeTime.isBlank()) return "交易時間為必填";
        
        // 2. 圖片數量檢查
        List<String> imagePaths = new ArrayList<>();
        if (imageFiles == null || imageFiles.isEmpty()) {
            return "至少需要一張商品圖片";
        }
        if (imageFiles.size() > 5) {
            return "圖片最多可上傳 5 張";
        }

        // 3. 文件儲存邏輯 (整合您提供的代碼)
        try {
            // 確保上傳目錄存在
            Path uploadDir = Paths.get(uploadPath);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            
            for (MultipartFile file : imageFiles) {
                if (!file.isEmpty()) {
                    // 使用 UUID 生成唯一文件名，防止重複
                    String originalFilename = file.getOriginalFilename();
                    String fileExtension = "";
                    if (originalFilename != null && originalFilename.contains(".")) {
                        fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    }
                    String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
                    Path filePath = uploadDir.resolve(uniqueFileName);

                    // 儲存文件到伺服器
                    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                    
                    // 將相對路徑存入資料庫，例如 "/uploads/uniqueFileName.jpg"
                    imagePaths.add("/uploads/" + uniqueFileName); 
                }
            }
        } catch (IOException e) {
            System.err.println("圖片儲存失敗: " + e.getMessage());
            return "圖片儲存失敗，請稍後再試";
        }

        // 4. 上架商品 (保留原有邏輯，使用處理後的 imagePaths，但設為未審核狀態)
        Product p = new Product(
            name,
            brand,
            price,
            conditionLevel,
            description,
            category,
            meetLocation,
            imagePaths, // <--- 傳遞儲存後的圖片路徑列表
            seller
        );
        
        // 設定交易時間
        p.setTradeTime(tradeTime);
        // 設定初始狀態
        p.setStatus("PENDING");
        
        // 新上傳的商品預設為未審核狀態
        p.setApproved(false);

        productRepo.save(p);
        return null; 
    }
    
    // 審核商品
    public String approveProduct(long productId) {
        Product p = productRepo.findById(productId);
        if (p == null) {
            return "商品不存在";
        }
        p.setApproved(true);
        p.setStatus("APPROVED");
        productRepo.save(p);
        return null;
    }
}