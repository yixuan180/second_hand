document.addEventListener("DOMContentLoaded", () => {

    const API = "http://localhost:8080/api";
    const path = window.location.pathname;

    const isLogin = path.includes("login.html");
    const isIndex = path.includes("index.html") || path.endsWith("/");
    const isDetail = path.includes("product_detail.html");
    const isUpload = path.includes("upload.html");

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
    // 1. 登入頁邏輯（加入 redirect）
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

                // ★★★ 登入成功後 redirect 核心功能在這裡
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
    // 2. 首頁 navbar（加入 redirect=upload）
    // =========================================
    if (isIndex) {

        const uploadLink = document.getElementById("upload-link");
        const chatLink = document.getElementById("chat-link");
        const userName = document.getElementById("user-name");
        const loginLink = document.getElementById("login-link");
        const logoutBtn = document.getElementById("logout-btn-real");

        checkLogin().then(data => {
            if (data.loggedIn) {

                // 登入後 navbar
                uploadLink.href = "upload.html";
                uploadLink.textContent = "商品上架";

                chatLink.style.display = "inline";

                userName.style.display = "inline";
                userName.textContent = data.username;

                loginLink.style.display = "none";

                logoutBtn.style.display = "inline";

            } else {

                // ★★★ 未登入時：點商品上架 → login.html?redirect=upload
                uploadLink.href = "login.html?redirect=upload";
                uploadLink.textContent = "商品上架";

                chatLink.style.display = "none";

                userName.style.display = "none";

                loginLink.style.display = "inline";

                logoutBtn.style.display = "none";
            }
        });

        // 登出
        logoutBtn.addEventListener("click", async () => {
            await fetch(`${API}/logout`, {
                method: "POST",
                credentials: "include"
            });
            alert("已登出");
            window.location.href = "index.html";
        });

        loadProducts();
    }

    // =========================================
    // 3. 商品列表
    // =========================================
    async function loadProducts() {
        const grid = document.querySelector(".product-grid");
        if (!grid) return;

        try {
            const res = await fetch(`${API}/products`);
            const products = await res.json();

            grid.innerHTML = "";

            if (products.length === 0) {
                grid.innerHTML = "<p>目前沒有商品。</p>";
                return;
            }

            products.forEach((p, index) => {
                const img = p.imagePaths && p.imagePaths.length > 0
                    ? `<img src="${p.imagePaths[0]}" style="width:100%;height:100%;object-fit:cover;">`
                    : `<div class="image-placeholder"></div>`;

                grid.innerHTML += `
                    <a href="product_detail.html?index=${index}" class="product-card-link">
                        <div class="product-card">
                            ${img}
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
    // 4. 詳細頁
    // =========================================
    if (isDetail) loadProductDetail();

    async function loadProductDetail() {
        const params = new URLSearchParams(location.search);
        const index = params.get("index");

        const res = await fetch(`${API}/products/${index}`);
        const p = await res.json();

        document.querySelector(".detail-item-name").textContent = p.name;
        document.querySelector(".detail-item-price").textContent = `$${p.price}`;
        document.querySelector(".product-description-text").textContent = p.description;

        const metas = document.querySelectorAll(".detail-item-meta");
        metas[0].textContent = `分類: ${p.category}`;
        metas[1].textContent = `狀況: ${p.conditionLevel}`;
        metas[2].textContent = `地點: ${p.meetLocation}`;

        if (p.imagePaths && p.imagePaths.length > 0) {
            document.querySelector(".main-image-placeholder").innerHTML =
                `<img src="${p.imagePaths[0]}" style="width:100%;height:100%;object-fit:cover;">`;
        }
    }

    // =========================================
    // 5. 上架商品頁（保持原樣）
    // =========================================
    if (isUpload) {

        checkLogin().then(data => {
            if (!data.loggedIn) {
                alert("請先登入再上架商品");
                window.location.href = "login.html?redirect=upload";
            }
        });

        const uploadForm = document.querySelector(".upload-form");
        let currentImageBase64 = null;

        const fileInput = document.getElementById("file-input");
        const previewImage = document.getElementById("preview-image");
        const uploadIcon = document.getElementById("upload-placeholder-icon");

        fileInput.addEventListener("change", e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = evt => {
                currentImageBase64 = evt.target.result;
                previewImage.src = currentImageBase64;
                previewImage.style.display = "block";
                uploadIcon.style.display = "none";
            };
            reader.readAsDataURL(file);
        });

        uploadForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const productData = {
                name: document.getElementById("product-name").value,
                brand: document.getElementById("brand").value,
                price: parseFloat(document.getElementById("price").value),
                conditionLevel: document.getElementById("condition").value,
                description: document.getElementById("description").value,
                category: document.getElementById("category").value,
                meetLocation: document.getElementById("location").value,
                imagePaths: currentImageBase64 ? [currentImageBase64] : []
            };

            const res = await fetch(`${API}/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(productData)
            });

            if (res.status === 401) {
                alert("請先登入！");
                location.href = "login.html?redirect=upload";
                return;
            }

            alert("上架成功！");
            location.href = "index.html";
        });
    }

});
// cc