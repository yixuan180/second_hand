package com.example.demo.service; // 修改這行

// 修改 import 路徑
import com.example.demo.repository.ProductRepository;
import com.example.demo.model.Product;
import com.example.demo.model.User;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProductService {

    private ProductRepository productRepo;

    public ProductService(ProductRepository productRepo) {
        this.productRepo = productRepo;
    }

    
    public String createProduct(
            User seller,
            String name,
            String brand,
            double price,
            String conditionLevel,
            String description,
            String category,
            String meetLocation,
            List<String> imagePaths
    ) {

        //必填欄位設定
        if (seller == null) {
            return "賣家資訊錯誤（尚未登入）";
        }

        if (name == null || name.isBlank()) {
            return "商品名稱為必填";
        }

        if (price <= 0) {
            return "價格必須大於 0";
        }

        if (conditionLevel == null || conditionLevel.isBlank()) {
            return "商品狀況必填";
        }

        if (description == null || description.isBlank()) {
            return "商品描述為必填";
        }

        if (category == null || category.isBlank()) {
            return "請選擇商品分類";
        }

        if (meetLocation == null || meetLocation.isBlank()) {
            return "交易地點為必填";
        }

        // 圖片限制至少一張，至多五張
        if (imagePaths == null || imagePaths.size() < 1) {
            return "至少需要一張商品圖片";
        }

        if (imagePaths.size() > 5) {
            return "圖片最多可上傳 5 張";
        }

        //上架商品
        Product p = new Product(
                name,
                brand,
                price,
                conditionLevel,
                description,
                category,
                meetLocation,
                imagePaths,
                seller
        );

        productRepo.save(p);
        return null; 
    }

    public List<Product> listAll() {
        return productRepo.findAll();
    }

    
    public Product findByIndex(int index) {
        return productRepo.findByIndex(index);
    }
}
