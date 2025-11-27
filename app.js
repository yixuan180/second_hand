document.addEventListener('DOMContentLoaded', () => {
    // --- 通用函式：控制導航欄顯示 ---
    function updateNav() {
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const loggedInLinks = document.getElementById('logged-in-links');
        const loggedOutLinks = document.getElementById('logged-out-links');

        if (loggedInLinks && loggedOutLinks) {
            if (loggedIn) {
                // 已登入：顯示上架、聊天、個人、登出
                loggedInLinks.style.display = 'block'; 
                loggedOutLinks.style.display = 'none';
            } else {
                // 未登入：顯示登入、註冊
                loggedInLinks.style.display = 'none';
                loggedOutLinks.style.display = 'block';
            }
        }
    }

    // 在頁面載入時呼叫一次
    updateNav();
    // --- 1. 基礎設定 ---
    const API_BASE_URL = 'http://localhost:8080/api';
    const path = window.location.pathname;
    
    // 頁面判斷 (相容不同路徑寫法)
    const isLoginPage = path.includes('login.html'); 
    const isProductsPage = path === '/' || path.includes('index.html');
    const isDetailPage = path.includes('product_detail.html');
    const isUploadPage = path.includes('upload.html');

    // --- 2. 登入頁邏輯 ---
    if (isLoginPage) {
        const loginForm = document.getElementById('login-form');
        const loginMessage = document.getElementById('login-message');

        if (localStorage.getItem('isLoggedIn') === 'true') {
            window.location.href = 'upload.html'; 
            return;
        }
        // 防止重複登入
        // if (localStorage.getItem('isLoggedIn') === 'true') {
        //     window.location.href = 'products.html';
        //     return;
        // }

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const usernameInput = document.getElementById('username').value;
                const passwordInput = document.getElementById('password').value;

                try {
                    const response = await fetch(`${API_BASE_URL}/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: usernameInput, password: passwordInput })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        localStorage.setItem('isLoggedIn', 'true');
                        // 儲存使用者名稱，上架商品時會用到
                        localStorage.setItem('currentUser', data.username); 
                        
                        loginMessage.style.color = "green";
                        loginMessage.textContent = '登入成功！';
                        updateNav();
                        setTimeout(() => window.location.href = 'upload.html', 800);
                    } else {
                        loginMessage.style.color = "red";
                        loginMessage.textContent = '帳號或密碼錯誤';
                    }
                } catch (error) {
                    console.error('Login Error:', error);
                    loginMessage.textContent = '連線失敗，請檢查後端是否開啟';
                }
            });
        }
    }

    // --- 3. 需登入頁面的共用邏輯 (登出與權限檢查) ---
    //  if (isProductsPage || isDetailPage || isUploadPage) {
    //     if (localStorage.getItem('isLoggedIn') !== 'true') {
    //          alert('請先登入');
    //          window.location.href = 'index.html';
    //          return;
    //      }

        const logoutBtn = document.getElementById('logout-btn-real');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear(); // 清除所有暫存
                alert('已登出');
                updateNav();
                window.location.href = 'index.html';
            });
        }
    

    // --- 4. 商品列表頁 (Products) ---
    // if (isProductsPage) {
    //     //loadProducts();
    // }

    async function loadProducts() {
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            const products = await response.json();
            
            const grid = document.querySelector('.product-grid');
            if (grid) {
                grid.innerHTML = ''; // 清空假資料

                if (products.length === 0) {
                    grid.innerHTML = '<p>目前沒有商品，快去上架吧！</p>';
                    return;
                }

                products.forEach((product, index) => {
                    // 處理圖片：如果有就顯示第一張，沒有就顯示灰色方塊
                    const imgHtml = (product.imagePaths && product.imagePaths.length > 0)
                        ? `<img src="${product.imagePaths[0]}" style="width:100%; height:100%; object-fit:cover;">`
                        : `<div class="image-placeholder"></div>`;

                    // 這裡的 href 加上 ?index=${index} 是為了讓詳細頁知道要抓哪一筆
                    const html = `
                        <a href="product_detail.html?index=${index}" class="product-card-link">
                            <div class="product-card">
                                ${imgHtml}
                                <div class="product-info">
                                    <p class="product-name">${product.name}</p>
                                    <p class="product-price">$${product.price}</p>
                                </div>
                            </div>
                        </a>
                    `;
                    grid.innerHTML += html;
                });
            }
        } catch (error) {
            console.error('Load products failed:', error);
        }
    }

    // --- 5. 商品詳細頁 (Detail) ---
    if (isDetailPage) {
        loadProductDetail();
    }

    async function loadProductDetail() {
        // 從網址列取得 index 參數 (例如 ?index=0)
        const params = new URLSearchParams(window.location.search);
        const index = params.get('index');

        if (index === null) {
            alert('無效的商品連結');
            window.location.href = 'index.html';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products/${index}`);
            if (!response.ok) throw new Error('找不到該商品');

            const product = await response.json();

            // 填入資料到 HTML
            document.querySelector('.detail-item-name').textContent = product.name;
            document.querySelector('.detail-item-price').textContent = `$${product.price}`;
            document.querySelector('.product-description-text').textContent = product.description;

            // 填入 Meta 資訊 (分類、狀況、地點)
            // 這裡依賴 HTML 結構順序，若 HTML 變動可能需調整
            const metas = document.querySelectorAll('.detail-item-meta');
            if (metas.length >= 3) {
                metas[0].textContent = `分類: ${product.category}`;
                metas[1].textContent = `狀況: ${product.conditionLevel}`;
                metas[2].textContent = `地點: ${product.meetLocation}`;
            }

            // 顯示圖片
            if (product.imagePaths && product.imagePaths.length > 0) {
                const mainImgContainer = document.querySelector('.main-image-placeholder');
                mainImgContainer.innerHTML = `<img src="${product.imagePaths[0]}" style="width:100%; height:100%; object-fit:cover;">`;
            }

        } catch (error) {
            console.error(error);
            alert('讀取商品失敗');
        }
    }

// --- 6. 商品上架頁 (Upload) ---
    if (isUploadPage) {
        if (localStorage.getItem('isLoggedIn')!=='true'){
            alert('請先登入能上傳商品!');
            window.location.href = 'login.html';
            return;
        }
        const uploadForm = document.querySelector('.upload-form');
        const fileInput = document.getElementById('multi-file-input');
        const uploadBox = document.getElementById('upload-box');
        const statusLabel = document.getElementById('upload-status');
        const previewContainer = document.getElementById('thumbnail-preview-container');
        //const uploadIcon = document.getElementById('upload-placeholder-icon');
        
        // 用來暫存圖片的 Base64 字串
        let currentImageBase64s = [];
        const MAX_IMAGES = 5;

        // 監聽：點擊上傳框時，觸發檔案輸入框
        if (uploadBox) {
            uploadBox.addEventListener('click', () => {
                fileInput.click();
            });
        }

        // 渲染預覽縮圖
        function renderThumbnails() {
            previewContainer.innerHTML = ''; // 清空現有預覽
            statusLabel.innerHTML = `☁️ 上傳圖片 (${currentImageBase64s.length}/${MAX_IMAGES})<span class="required-star">*</span>`;

            currentImageBase64s.forEach((base64, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'thumbnail-image-wrapper';
                
                const img = document.createElement('img');
                img.src = base64;
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'thumbnail-delete-btn';
                deleteBtn.textContent = 'X';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation(); // 阻止點擊冒泡
                    currentImageBase64s.splice(index, 1); // 刪除該圖片
                    renderThumbnails(); // 重新渲染
                };

                wrapper.appendChild(img);
                wrapper.appendChild(deleteBtn);
                previewContainer.appendChild(wrapper);
            });
            
            // 如果已達上限，隱藏主上傳框
            uploadBox.style.display = currentImageBase64s.length >= MAX_IMAGES ? 'none' : 'flex';
        }

        // 監聽：當使用者選了檔案
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const files = Array.from(e.target.files); // 抓取第一個檔案
                
                // 檢查是否超出最大數量
                const remainingSlots = MAX_IMAGES - currentImageBase64s.length;
                const filesToProcess = files.slice(0, remainingSlots);
                if (files.length > remainingSlots) {
                    alert(`最多只能上傳 ${MAX_IMAGES} 張圖片。已自動選取前 ${remainingSlots} 張。`);
                }

                filesToProcess.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        currentImageBase64s.push(event.target.result);
                        renderThumbnails();
                    };
                    reader.readAsDataURL(file);
                });

                // 重設檔案輸入框，以便再次選擇相同的檔案
                e.target.value = null; 
            });
        }
        //         if (file) {
        //             const reader = new FileReader();
                    
        //             // 當檔案讀取完成後
        //             reader.onload = function(event) {
        //                 currentImageBase64 = event.target.result; //這就是轉換後的長字串
                        
        //                 // 顯示預覽圖
        //                 previewImage.src = currentImageBase64;
        //                 previewImage.style.display = 'block';
        //                 uploadIcon.style.display = 'none'; // 隱藏雲朵圖示
        //             };
                    
        //             // 開始讀取檔案
        //             reader.readAsDataURL(file);
        //         }
        //     });
        // }

        if (uploadForm) {
            uploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                // 檢查是否至少上傳了一張圖片
                if (currentImageBase64s.length === 0) {
                    alert('請至少上傳一張商品圖片！');
                    return;
                }
                
                // // 檢查有沒有選圖片
                // const finalImagePaths = [];
                // if (currentImageBase64) {
                //     finalImagePaths.push(currentImageBase64);
                // } else {
                //     // 如果沒選圖，還是給一張假圖，避免壞掉
                //     finalImagePaths.push("https://via.placeholder.com/300");
                // }

                // 準備要傳給後端的資料
                const currentUser = localStorage.getItem('currentUser') || 'test';
                
                const productData = {
                    name: document.getElementById('product-name').value,
                    brand: document.getElementById('brand').value,
                    price: parseFloat(document.getElementById('price').value),
                    conditionLevel: document.getElementById('condition').value,
                    description: document.getElementById('description').value,
                    category: document.getElementById('category').value,
                    meetLocation: document.getElementById('location').value,
                    
                    // 關鍵修改：傳送真正的圖片字串
                    imagePaths: currentImageBase64s, 
                    
                    seller: { username: currentUser, password: "" } 
                };

                try {
                    const response = await fetch(`${API_BASE_URL}/products`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(productData)
                    });

                    const result = await response.json();

                    if (response.ok) {
                        alert('上架成功！');
                        window.location.href = 'index.html';
                    } else {
                        alert('上架失敗：' + (result.message || '未知錯誤'));
                    }
                } catch (error) {
                    console.error('Upload failed:', error);
                    alert('系統錯誤，請稍後再試');
                }
            });
        }
    }
    
    // --- 7. 下拉選單 UI (保留原樣) ---
    const dropbtn = document.querySelector('.dropbtn');
    const dropdown = document.querySelector('.dropdown');
    if (dropbtn && dropdown) {
        dropbtn.addEventListener('click', () => dropdown.classList.toggle('active'));
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
            }
        });
    }
});