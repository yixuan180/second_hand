document.addEventListener("DOMContentLoaded", () => {

    const API = "http://localhost:8080/api";
    const path = window.location.pathname;

    const isLogin = path.includes("login.html");
    const isIndex = path.includes("index.html") || path.endsWith("/");
    const isDetail = path.includes("product_detail.html");
    const isUpload = path.includes("upload.html");
    const isReview = path.includes("review.html");
    
    // 分類中英文對照
    const categoryMap = {
        'clothing': '衣服',
        'accessories': '飾品',
        'electronics': '電器',
        'household': '生活物品',
        'other': '其他'
    };
    
    // 商品狀況中英文對照
    const conditionMap = {
        'new': '全新',
        'used': '二手'
    };

    // 檢查登入狀態
    async function checkLogin() {
        try {
            const res = await fetch(`${API}/check-login`, { credentials: "include" });
            return await res.json();
        } catch (e) {
            console.error("checkLogin error:", e);
            return { loggedIn: false };
        }
    }

    // =========================================
    // 1. 登入頁邏輯（保持不變）
    // =========================================
    if (isLogin) {

        const loginForm = document.getElementById("login-form");
        const loginMessage = document.getElementById("login-message");

        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            const res = await fetch(`${API}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, password })
            });

            if (res.status === 401) {
                loginMessage.textContent = "帳號或密碼錯誤";
                loginMessage.style.color = "red";
            } else {
                loginMessage.textContent = "登入成功！";
                loginMessage.style.color = "green";

                // 登入成功後 redirect 核心功能在這裡
                setTimeout(() => {

                    const params = new URLSearchParams(window.location.search);
                    const redirectPage = params.get("redirect");

                    if (redirectPage === "upload") {
                        window.location.href = "upload.html";
                    } else {
                        window.location.href = "index.html";
                    }

                }, 600);
            }
        });
    }

    // =========================================
    // 2. 導航欄邏輯 (支援下拉選單，根據身份動態調整)
    // =========================================
    {
        const uploadLink = document.getElementById("upload-link");
        const chatLink = document.getElementById("chat-link");
        const userName = document.getElementById("user-name");
        const loginLink = document.getElementById("login-link");
        const logoutBtn = document.getElementById("logout-btn-real");
        
        // 取得新的下拉選單容器
        const userMenuDropdown = document.getElementById("user-menu-dropdown");

        checkLogin().then(data => {
            if (data.loggedIn) {

                // 根據是否為管理員調整導航欄
                if (data.isAdmin) {
                    // 管理員：隱藏上架和聊天，隱藏下拉選單，直接顯示審核清單和名稱
                    if (uploadLink) uploadLink.style.display = "none";
                    if (chatLink) chatLink.style.display = "none";
                    
                    // 隱藏下拉選單完全不顯示
                    if (userMenuDropdown) {
                        userMenuDropdown.style.display = "none";
                    }
                    
                    // 創建管理員名稱顯示（如果還沒有）
                    if (!document.getElementById("admin-name-link")) {
                        const adminName = document.createElement("a");
                        adminName.id = "admin-name-link";
                        adminName.href = "#";
                        adminName.className = "nav-link";
                        adminName.textContent = data.username || "管理員";
                        adminName.style.pointerEvents = "none"; // 禁用點擊
                        adminName.style.cursor = "default";
                        
                        // 插入到登出按鈕之前
                        if (logoutBtn && logoutBtn.parentNode) {
                            logoutBtn.parentNode.insertBefore(adminName, logoutBtn);
                        }
                    }
                    
                    // 創建審核清單直接連結（如果還沒有）
                    if (!document.getElementById("admin-review-link")) {
                        const reviewLink = document.createElement("a");
                        reviewLink.id = "admin-review-link";
                        reviewLink.href = "review.html";
                        reviewLink.className = "nav-link";
                        reviewLink.textContent = "審核清單";
                        
                        // 插入到登出按鈕之前
                        if (logoutBtn && logoutBtn.parentNode) {
                            logoutBtn.parentNode.insertBefore(reviewLink, logoutBtn);
                        }
                    }
                } else {
                    // 普通用戶：保持原有邏輯
                    if (uploadLink) uploadLink.href = "upload.html";
                    if (uploadLink) uploadLink.textContent = "商品上架";

                    if (chatLink) chatLink.style.display = "inline";

                    // 顯示下拉選單容器
                    if (userMenuDropdown) {
                        userMenuDropdown.style.display = "inline-block"; 
                    }
                    
                    // 隱藏審核清單選項
                    const reviewLink = document.getElementById("review-link");
                    if (reviewLink) {
                        reviewLink.style.display = "none";
                    }
                }
                
                if (userName) {
                    userName.textContent = data.username;
                }
                
                if (loginLink) loginLink.style.display = "none";

                if (logoutBtn) logoutBtn.style.display = "inline";

            } else {

                // 未登入時：
                if (uploadLink) uploadLink.href = "login.html?redirect=upload";
                if (uploadLink) uploadLink.textContent = "商品上架";

                if (chatLink) chatLink.style.display = "none";

                // 隱藏下拉選單容器
                if (userMenuDropdown) {
                    userMenuDropdown.style.display = "none";
                }

                if (loginLink) loginLink.style.display = "inline";

                if (logoutBtn) logoutBtn.style.display = "none";
            }
        });

        // 登出
        if (logoutBtn) {
            logoutBtn.addEventListener("click", async () => {
                await fetch(`${API}/logout`, {
                    method: "POST",
                    credentials: "include"
                });
                alert("已登出");
                window.location.href = "index.html";
            });
        }
    }
    
    // 如果是首頁，載入商品列表
    if (isIndex) {
        loadProducts();
    }

    // =========================================
    // 3. 商品列表 (只顯示第一張圖片，且只顯示已審核商品)
    // =========================================
    async function loadProducts() {
        const grid = document.querySelector(".product-grid");
        if (!grid) return;

        try {
            // 改為從 /api/products/approved 獲取已審核商品
            const res = await fetch(`${API}/products/approved`);
            const products = await res.json();

            grid.innerHTML = "";

            if (products.length === 0) {
                grid.innerHTML = "<p>目前沒有商品。</p>";
                return;
            }

            // 使用 Set 根據 ID 去重，防止重複商品顯示
            const uniqueProductsMap = new Map();
            for (const p of products) {
                if (!uniqueProductsMap.has(p.id)) {
                    uniqueProductsMap.set(p.id, p);
                }
            }
            const uniqueProducts = Array.from(uniqueProductsMap.values());

            uniqueProducts.forEach((p, index) => {
                
                // *** 關鍵修改：只取第一張圖片路徑 ***
                let imageHtml = '';
                if (p.imagePaths && p.imagePaths.length > 0) {
                    const firstImagePath = p.imagePaths[0]; 
                    
                    // 使用 <img> 標籤顯示圖片
                    imageHtml = `<img src="${firstImagePath}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">`;
                    
                } else {
                    // 如果沒有圖片，使用佔位符
                    imageHtml = `<div class="image-placeholder"></div>`;
                }


                grid.innerHTML += `
                    <a href="product_detail.html?id=${p.id}" class="product-card-link">
                        <div class="product-card">
                            ${imageHtml}
                            <div class="product-info">
                                <p class="product-name">${p.name}</p>
                                <p class="product-price">$${p.price}</p>
                            </div>
                        </div>
                    </a>`;
            });

        } catch (e) {
            console.error("loadProducts error:", e);
        }
    }

    // =========================================
    // 4. 詳細頁 (圖片畫廊邏輯)
    // =========================================
    if (isDetail) loadProductDetail();

    async function loadProductDetail() {
        const params = new URLSearchParams(location.search);
        const id = params.get("id");
        const index = params.get("index"); // 保留向後相容性

        let url = id ? `${API}/products/detail/${id}` : `${API}/products/${index}`;
        const res = await fetch(url);
        const p = await res.json();
        
        console.log("完整產品對象:", p);
        console.log("tradeTime 值:", p.tradeTime);

        // 1. 設置基本文字信息
        document.querySelector(".detail-item-name").textContent = p.name;
        document.querySelector(".detail-item-price").textContent = `$${p.price}`;
        document.querySelector(".product-description-text").textContent = p.description;

        const metas = document.querySelectorAll(".detail-item-meta");
        metas[0].textContent = `分類: ${categoryMap[p.category] || p.category}`;
        metas[1].textContent = `狀況: ${conditionMap[p.conditionLevel] || p.conditionLevel}`;
        metas[2].textContent = `地點: ${p.meetLocation}`;
        
        // 顯示交易時間 - 在 metas[2] 之後添加
        if (metas[2]) {
            const tradeTimeEl = document.createElement("p");
            tradeTimeEl.classList.add("detail-item-meta");
            tradeTimeEl.textContent = `交易時間: ${p.tradeTime || '未指定'}`;
            metas[2].parentNode.insertBefore(tradeTimeEl, metas[2].nextSibling);
        }
        
        // 2. 圖片畫廊邏輯
        const imagePaths = p.imagePaths || [];
        const mainImageDisplay = document.getElementById("main-image-display");
        const thumbnailContainer = document.getElementById("thumbnail-container");

        // 輔助函數：更新主圖
        function updateMainImage(path) {
            mainImageDisplay.innerHTML = `<img src="${path}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover; border-radius: 5px;">`;
        }

        // 處理沒有圖片的情況
        if (imagePaths.length === 0) {
            mainImageDisplay.innerHTML = `<div class="image-placeholder">暫無圖片</div>`;
            return;
        }

        // 2.1 顯示第一張圖片作為預設主圖
        updateMainImage(imagePaths[0]);
        
        // 2.2 清空縮圖容器並開始渲染
        thumbnailContainer.innerHTML = '';
        
        imagePaths.forEach((path, index) => {
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.classList.add('thumbnail-placeholder');
            
            // 使用背景圖片，方便控制縮圖邊框和點擊效果
            thumbnailDiv.style.backgroundImage = `url('${path}')`;
            thumbnailDiv.style.backgroundSize = 'cover';
            thumbnailDiv.style.backgroundPosition = 'center';
            thumbnailDiv.dataset.imagePath = path; // 儲存完整圖片路徑
            
            // 預設將第一張圖標記為選中狀態
            if (index === 0) {
                thumbnailDiv.classList.add('selected-thumb');
            }

            // 2.3 設置點擊事件：切換主圖
            thumbnailDiv.addEventListener('click', (e) => {
                const selectedPath = e.currentTarget.dataset.imagePath;
                updateMainImage(selectedPath);
                
                // 移除所有縮圖的選中狀態
                document.querySelectorAll('.thumbnail-placeholder').forEach(thumb => {
                    thumb.classList.remove('selected-thumb');
                });
                // 為當前點擊的縮圖添加選中狀態
                e.currentTarget.classList.add('selected-thumb');
            });
            
            thumbnailContainer.appendChild(thumbnailDiv);
        });
    }


    // =========================================
    // 5. 上架商品頁 (核心修改：多圖預覽與 FormData 上傳)
    // =========================================
    if (isUpload) {

        checkLogin().then(data => {
            if (!data.loggedIn) {
                alert("請先登入再上架商品");
                window.location.href = "login.html?redirect=upload";
            }
        });

        const uploadForm = document.querySelector(".upload-form");
        
        // DOM 元素
        const fileInput = document.getElementById("image-file-input");
        const placeholder = document.getElementById("upload-placeholder");
        const thumbnailsContainer = document.getElementById("thumbnails-container");
        const uploadLimitSpan = document.querySelector(".upload-limit");
        const categorySelect = document.getElementById("category");
        const customCategoryRow = document.getElementById("custom-category-row");
        const customCategoryInput = document.getElementById("custom-category");
        
        let selectedFiles = []; 
        const MAX_FILES = 5;
        
        // 分類選擇事件監聽 - 當選擇「其他」時顯示輸入框
        if (categorySelect) {
            categorySelect.addEventListener("change", (e) => {
                if (e.target.value === "other") {
                    if (customCategoryRow) customCategoryRow.style.display = "block";
                    if (customCategoryInput) customCategoryInput.required = true;
                } else {
                    if (customCategoryRow) customCategoryRow.style.display = "none";
                    if (customCategoryInput) {
                        customCategoryInput.required = false;
                        customCategoryInput.value = "";
                    }
                }
            });
        }

        // 點擊佔位符時觸發檔案選擇
        if (placeholder) {
            placeholder.addEventListener("click", () => {
                fileInput.click();
            });
        }

        // 處理檔案選擇事件
        if (fileInput) {
            fileInput.addEventListener("change", (e) => {
                const newFiles = Array.from(e.target.files);
                
                // 將新檔案加入已選擇的列表，並確保不超過最大限制
                selectedFiles = [...selectedFiles, ...newFiles].slice(0, MAX_FILES);
                
                // 重新渲染縮圖列表
                renderThumbnails();
                
                // 清空 input 的 value，以便使用者再次選擇同名檔案
                fileInput.value = null; 
            });
        }


        // 移除按鈕的事件監聽器 (集中處理)
        function attachRemoveListeners() {
            document.querySelectorAll('.remove-btn').forEach(button => {
                // 移除舊的監聽器以避免重複觸發
                button.removeEventListener('click', handleRemoveClick); 
                button.addEventListener('click', handleRemoveClick);
            });
        }
        
        function handleRemoveClick(e) {
            e.stopPropagation(); // 阻止事件冒泡到父層
            
            // 找出點擊的按鈕所對應的縮圖元素
            const thumbnailElement = e.target.closest('.thumbnail-placeholder');
            const allThumbnails = Array.from(thumbnailsContainer.querySelectorAll('.thumbnail-placeholder:not(.upload-box)'));
            const indexToRemove = allThumbnails.indexOf(thumbnailElement);
            
            if (indexToRemove !== -1) {
                 // 從列表中移除檔案
                selectedFiles.splice(indexToRemove, 1);
                
                // 重新渲染整個縮圖列表
                renderThumbnails();
            }
        }
        
        // 重新渲染整個縮圖列表的輔助函數
        function renderThumbnails() {
            // 移除所有舊的縮圖 (除了佔位符)
            Array.from(thumbnailsContainer.querySelectorAll('.thumbnail-placeholder:not(.upload-box)')).forEach(el => el.remove());
            
            // 渲染
            selectedFiles.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const thumbnailHtml = `
                        <div class="thumbnail-placeholder" style="background-image: url('${event.target.result}'); background-size: cover; background-position: center;">
                            <button type="button" class="remove-btn">X</button>
                        </div>
                    `;
                    placeholder.insertAdjacentHTML('beforebegin', thumbnailHtml);
                    attachRemoveListeners(); 
                };
                reader.readAsDataURL(file);
            });
            
            // 更新計數顯示
            uploadLimitSpan.textContent = `${selectedFiles.length} / ${MAX_FILES}`;

            // 顯示/隱藏佔位符
            if (selectedFiles.length >= MAX_FILES) {
                 placeholder.style.display = 'none';
            } else {
                 placeholder.style.display = 'flex';
            }
        }


        // 處理表單提交
        if (uploadForm) {
            uploadForm.addEventListener("submit", async (e) => {
                e.preventDefault();

                // 1. 執行圖片數量檢查
                if (selectedFiles.length === 0 || selectedFiles.length > MAX_FILES) {
                    alert("請上傳 1 到 5 張商品圖片");
                    return;
                }

                // 2. 取得所有文字欄位的值
                const name = document.getElementById("product-name").value;
                const brand = document.getElementById("brand").value;
                const price = parseFloat(document.getElementById("price").value);
                const conditionLevel = document.getElementById("condition").value;
                const description = document.getElementById("description").value;
                let category = document.getElementById("category").value;
                const meetLocation = document.getElementById("location").value;
                const tradeTime = document.getElementById("trade-time").value;
                
                // 如果分類是「其他」，使用自定義分類
                if (category === "other") {
                    const customCategory = document.getElementById("custom-category").value;
                    if (!customCategory.trim()) {
                        alert("請輸入自定義分類");
                        return;
                    }
                    category = customCategory;
                }
                
                // 檢查交易時間
                if (!tradeTime) {
                    alert("請選擇交易時間");
                    return;
                }
                
                // 3. 建立 FormData 物件
                const formData = new FormData();
                
                // 添加所有文字欄位
                formData.append("name", name);
                formData.append("brand", brand);
                // 注意：這裡直接將 float 值傳入 FormData
                formData.append("price", price); 
                formData.append("conditionLevel", conditionLevel);
                formData.append("description", description);
                formData.append("category", category);
                formData.append("meetLocation", meetLocation);
                formData.append("tradeTime", tradeTime);

                // 4. 添加所有已選擇的圖片文件
                selectedFiles.forEach((file) => {
                    formData.append("imageFiles", file);
                });

                // 5. 發送請求
                const res = await fetch(`${API}/products`, {
                    method: "POST",
                    credentials: "include",
                    body: formData 
                });

                if (res.status === 401) {
                    alert("請先登入！");
                    location.href = "login.html?redirect=upload";
                    return;
                }
                
                const resultData = await res.json();

                if (res.ok) {
                    alert("成功送審！");
                    location.href = "index.html";
                } else {
                    alert("上架失敗: " + (resultData.message || res.statusText));
                }
            });
        } // End of uploadForm listener
    }

    // =========================================
    // 6. 審核頁面邏輯
    // =========================================
    
    // 定義全局的 loadPendingProducts 和 approveProduct 函數
    window.loadPendingProducts = async function() {
        const container = document.getElementById("pending-products-list");
        if (!container) return;

        try {
            const res = await fetch(`${API}/products/pending`);
            const products = await res.json();

            container.innerHTML = "";

            if (products.length === 0) {
                container.innerHTML = '<div class="review-empty-message">暫無待審核商品</div>';
                return;
            }

            // 使用 Set 根據 ID 去重，防止重複商品顯示
            const uniqueProductsMap = new Map();
            for (const p of products) {
                if (!uniqueProductsMap.has(p.id)) {
                    uniqueProductsMap.set(p.id, p);
                }
            }
            const uniqueProducts = Array.from(uniqueProductsMap.values());

            uniqueProducts.forEach((p) => {
                const imageUrl = (p.imagePaths && p.imagePaths.length > 0) ? p.imagePaths[0] : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23ddd' width='150' height='150'/%3E%3C/svg%3E";
                
                const productCard = document.createElement("div");
                productCard.className = "review-product-card";
                productCard.setAttribute("data-product-id", p.id);
                productCard.innerHTML = `
                    <img src="${imageUrl}" alt="${p.name}" class="review-product-image">
                    <div class="review-product-info">
                        <h3>${p.name}</h3>
                        <div class="review-product-detail">品牌: ${p.brand || "未填"}</div>
                        <div class="review-product-detail">價格: $${p.price}</div>
                        <div class="review-product-detail">狀況: ${conditionMap[p.conditionLevel] || p.conditionLevel}</div>
                        <div class="review-product-detail">分類: ${categoryMap[p.category] || p.category}</div>
                        <div class="review-product-detail">地點: ${p.meetLocation}</div>
                        <div class="review-product-detail">交易時間: ${p.tradeTime || "未填"}</div>
                        <div class="review-product-detail">賣家: ${p.sellerUsername || p.seller?.username || "未知"}</div>
                        <div class="review-product-detail">描述: ${p.description}</div>
                        <div class="review-product-actions">
                            <button class="btn-approve" onclick="approveProduct(${p.id})">審核通過</button>
                            <button class="btn-reject" onclick="toggleRejectReason(${p.id})">審核不通過</button>
                        </div>
                        <div class="reject-reason-input" id="reject-reason-${p.id}">
                            <label for="reason-text-${p.id}">拒絕原因 (必填):</label><br>
                            <textarea id="reason-text-${p.id}" placeholder="請說明商品被拒絕的原因..."></textarea>
                            <div class="reject-reason-buttons">
                                <button type="button" class="btn-confirm-reject" onclick="submitRejectProduct(${p.id})">確認拒絕</button>
                                <button type="button" class="btn-cancel-reject" onclick="toggleRejectReason(${p.id})">取消</button>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(productCard);
            });

        } catch (e) {
            console.error("loadPendingProducts error:", e);
            container.innerHTML = '<div class="review-empty-message">載入失敗</div>';
        }
    };

    // 切換拒絕原因輸入框
    window.toggleRejectReason = function(productId) {
        const reasonDiv = document.getElementById(`reject-reason-${productId}`);
        if (reasonDiv) {
            reasonDiv.classList.toggle("show");
        }
    };

    // 提交拒絕商品
    window.submitRejectProduct = async function(productId) {
        const reasonTextarea = document.getElementById(`reason-text-${productId}`);
        const reason = reasonTextarea.value.trim();
        
        if (!reason) {
            alert("請填寫拒絕原因");
            return;
        }

        try {
            const res = await fetch(`${API}/products/${productId}/reject`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: reason })
            });

            const data = await res.json();

            if (res.ok) {
                alert("商品已拒絕");
                // 發送通知給使用者
                window.addNotification(data.productName, data.reason);
                // 立即從頁面移除該商品卡片
                const productCard = document.querySelector(`[data-product-id="${productId}"]`);
                if (productCard) {
                    productCard.remove();
                }
                // 檢查是否還有商品，如果沒有就顯示空狀態
                const container = document.getElementById("pending-products-list");
                if (container && container.children.length === 0) {
                    container.innerHTML = '<div class="review-empty-message">暫無待審核商品</div>';
                }
            } else {
                alert("拒絕失敗: " + (data.message || res.statusText));
            }
        } catch (e) {
            console.error("submitRejectProduct error:", e);
            alert("發生錯誤");
        }
    };

    // 全局函數供按鈕使用
    window.approveProduct = async function(productId) {
        if (!confirm("確認審核通過此商品？")) return;

        try {
            const res = await fetch(`${API}/products/${productId}/approve`, {
                method: "POST",
                credentials: "include"
            });

            const data = await res.json();

            if (res.ok) {
                alert("審核通過");
                // 審核成功後導向首頁，2秒後自動跳轉
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 500);
            } else {
                alert("審核失敗: " + (data.message || res.statusText));
            }
        } catch (e) {
            console.error("approveProduct error:", e);
            alert("發生錯誤");
        }
    };
    
    if (isReview) {
        checkLogin().then(data => {
            if (!data.loggedIn || !data.isAdmin) {
                alert("只有管理員才能訪問此頁面");
                window.location.href = "index.html";
            } else {
                window.loadPendingProducts();
            }
        });
    }
    
    // =========================================
    // 通知系統
    // =========================================
    let notifications = [];
    
    // 從localStorage加載通知
    function loadNotifications() {
        const stored = localStorage.getItem('product_notifications');
        if (stored) {
            notifications = JSON.parse(stored);
        }
        updateNotificationUI();
    }
    
    // 保存通知到localStorage
    function saveNotifications() {
        localStorage.setItem('product_notifications', JSON.stringify(notifications));
    }
    
    // 添加通知
    window.addNotification = function(productName, reason) {
        const notification = {
            id: Date.now(),
            productName: productName,
            reason: reason,
            timestamp: new Date().toLocaleString('zh-TW')
        };
        notifications.unshift(notification);
        saveNotifications();
        updateNotificationUI();
    };
    
    // 更新通知UI
    function updateNotificationUI() {
        const notificationCount = document.getElementById('notification-count');
        const notificationList = document.getElementById('notification-list');
        
        if (!notificationList) return;
        
        notificationList.innerHTML = '';
        
        if (notifications.length === 0) {
            notificationList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">暫無通知</div>';
            if (notificationCount) notificationCount.style.display = 'none';
        } else {
            if (notificationCount) {
                notificationCount.textContent = notifications.length;
                notificationCount.style.display = 'flex';
            }
            
            notifications.forEach(notif => {
                const notifEl = document.createElement('div');
                notifEl.style.cssText = 'padding: 12px; border-bottom: 1px solid #eee; font-size: 0.9em; background: #fff3cd;';
                notifEl.innerHTML = `
                    <div style="font-weight: bold; color: #d32f2f; margin-bottom: 5px;">❌ ${notif.productName}</div>
                    <div style="color: #666; margin-bottom: 5px;">原因: ${notif.reason}</div>
                    <div style="font-size: 0.8em; color: #999;">${notif.timestamp}</div>
                `;
                notificationList.appendChild(notifEl);
            });
        }
    }
    
    // 清除通知
    function clearNotifications() {
        notifications = [];
        saveNotifications();
        updateNotificationUI();
    }
    
    // 通知面板按鈕控制（只在會員登入時初始化）
    function initNotificationPanel() {
        const notificationBtn = document.getElementById('notification-btn');
        const notificationPanel = document.getElementById('notification-panel');
        const clearBtn = document.getElementById('clear-notifications');
        const notificationBtnContainer = document.getElementById('notification-btn-container');
        
        if (notificationBtn && notificationPanel && notificationBtnContainer) {
            // 顯示通知按鈕容器
            notificationBtnContainer.style.display = 'block';
            
            notificationBtn.addEventListener('click', () => {
                if (notificationPanel.style.right === '-350px' || notificationPanel.style.right === '') {
                    notificationPanel.style.right = '10px';
                } else {
                    notificationPanel.style.right = '-350px';
                }
            });
            
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    if (confirm('確定要清除所有通知嗎？')) {
                        clearNotifications();
                    }
                });
            }
            
            // 頁面加載時載入通知
            loadNotifications();
        }
    }
    
    // 在登入邏輯中調用初始化通知面板
    // 檢查登入狀態，如果是會員就初始化通知功能
    checkLogin().then(data => {
        if (data.loggedIn && !data.isAdmin) {
            // 只有會員（非管理員）才顯示通知功能
            initNotificationPanel();
        }
    });

});