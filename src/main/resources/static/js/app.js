/* ==========================================================================
   1. ESTADO GLOBAL E CARREGAMENTO DA API
   ========================================================================== */
let products = [];
let cart = JSON.parse(localStorage.getItem('drop_cart')) || [];
let currentCategory = 'all';
let currentSearchQuery = '';

window.addEventListener('DOMContentLoaded', async () => {
    await loadProductsFromAPI();

    // Atualiza o botão de autenticação se houver um utilizador logado
    const userName = localStorage.getItem('drop_user_name');
    const authBtn = document.getElementById('authActionBtn');

    if (userName && authBtn) {
        authBtn.innerText = `Olá, ${userName.split(' ')[0]}`;
        authBtn.href = "#";
        authBtn.onclick = (e) => {
            e.preventDefault();
            if (confirm("Deseja terminar sessão?")) {
                logout();
            }
        };
    }

    if (document.getElementById('productGrid')) {
        renderStoreGrid();
        setupSearchListeners();
    }

    if (document.getElementById('adminProductTable')) {
        renderAdminTable();
        updateAdminMetrics();
    }

    updateCartUI();
    setupAuthListeners();
});

async function loadProductsFromAPI() {
    try {
        const response = await fetch('/api/produtos');
        if (response.ok) {
            products = await response.json();
        } else {
            console.error("Erro ao carregar produtos do servidor.");
        }
    } catch (error) {
        console.error("Erro de conexão com a API:", error);
    }
}

function saveCartState() {
    localStorage.setItem('drop_cart', JSON.stringify(cart));
}

function logout() {
    localStorage.removeItem('drop_user_role');
    localStorage.removeItem('drop_user_name');
    window.location.href = 'login.html';
}

function showToast(message, type = "success") {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const bgClass = type === "error" ? "bg-red-950 border-red-800 text-red-200" : "bg-brand-card border-brand-neon text-white";
    toast.className = `p-3 rounded-lg border ${bgClass} shadow-xl text-xs font-bold transition-all transform translate-y-0 opacity-100`;
    toast.innerHTML = message;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function formatCategoryName(catKey) {
    const names = { decks: "Shapes", trucks: "Trucks", wheels: "Rodas/Rolamentos", shoes: "Tênis", apparel: "Vestuário" };
    return names[catKey] || "Geral";
}

/* ==========================================================================
   2. LÓGICA DA LOJA (index.html)
   ========================================================================== */
function setupSearchListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.toLowerCase().trim();
            renderStoreGrid();
        });
    }
}

function filterCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.cat-btn').forEach(btn => {
        if (btn.dataset.cat === category) {
            btn.classList.add('bg-brand-neon', 'text-black');
            btn.classList.remove('hover:text-white');
        } else {
            btn.classList.remove('bg-brand-neon', 'text-black');
            btn.classList.add('hover:text-white');
        }
    });
    renderStoreGrid();
}

function applyFiltersAndSort() {
    renderStoreGrid();
}

function renderStoreGrid() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const sortVal = document.getElementById('sortSelect') ? document.getElementById('sortSelect').value : 'relevance';

    let filtered = products.filter(p => {
        const matchesCat = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = p.title.toLowerCase().includes(currentSearchQuery);
        return matchesCat && matchesSearch;
    });

    if (sortVal === 'price_asc') filtered.sort((a, b) => a.price - b.price);
    if (sortVal === 'price_desc') filtered.sort((a, b) => b.price - a.price);

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500">Nenhum produto encontrado.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(product => `
        <div class="bg-brand-card border border-brand-border rounded-xl overflow-hidden flex flex-col group">
            <div class="h-48 overflow-hidden bg-brand-dark">
                <img src="${product.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                <h3 class="font-bold text-xs text-white line-clamp-2">${product.title}</h3>
                <div class="flex items-center justify-between">
                    <span class="font-extrabold text-sm text-brand-neon">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</span>
                    <button onclick="addToCart(${product.id})" class="p-2 bg-brand-border text-white rounded hover:bg-brand-neon hover:text-black transition"><i class="fa-solid fa-cart-plus"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

/* ==========================================================================
   3. LÓGICA DO CARRINHO
   ========================================================================== */
function openCart() {
    document.getElementById('cartDrawer').classList.remove('pointer-events-none');
    document.getElementById('cartBackdrop').classList.remove('opacity-0');
    document.getElementById('cartContent').classList.remove('translate-x-full');
}

function closeCart() {
    document.getElementById('cartBackdrop').classList.add('opacity-0');
    document.getElementById('cartContent').classList.add('translate-x-full');
    setTimeout(() => document.getElementById('cartDrawer').classList.add('pointer-events-none'), 300);
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);

    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    saveCartState();
    updateCartUI();
    openCart();
    showToast("Adicionado ao carrinho!");
}

function removeCartItem(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCartState();
    updateCartUI();
}

function updateCartUI() {
    const cartBadge = document.getElementById('cartBadge');
    const cartList = document.getElementById('cartItemsList');
    if (!cartBadge || !cartList) return;

    cartBadge.innerText = cart.reduce((acc, i) => acc + i.qty, 0);
    const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    document.getElementById('cartTotal').innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;

    if (cart.length === 0) {
        cartList.innerHTML = `<p class="text-center text-gray-500 text-xs mt-10">Carrinho vazio</p>`;
        return;
    }

    cartList.innerHTML = cart.map(item => `
        <div class="flex gap-3 bg-brand-dark p-2 rounded border border-brand-border">
            <img src="${item.image}" class="w-12 h-12 object-cover rounded">
            <div class="flex-1">
                <div class="text-xs font-bold text-white truncate">${item.title}</div>
                <div class="text-xs text-brand-neon font-bold">R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}</div>
                <button onclick="removeCartItem(${item.id})" class="text-[10px] text-red-400 hover:underline">Remover</button>
            </div>
            <div class="text-xs font-bold self-center mr-2">x${item.qty}</div>
        </div>
    `).join('');
}

function openCheckoutModal() {
    if (cart.length === 0) return showToast("Carrinho vazio!", "error");
    cart = [];
    saveCartState();
    updateCartUI();
    closeCart();
    showToast("Pedido realizado com sucesso!");
}

/* ==========================================================================
   4. LÓGICA DO ADMIN (admin.html) - INTEGRADA COM O ORACLE
   ========================================================================== */
function updateAdminMetrics() {
    if (!document.getElementById('statProductsCount')) return;
    document.getElementById('statProductsCount').innerText = products.length;
    document.getElementById('statLowStock').innerText = products.filter(p => p.stock < 5).length;
}

function renderAdminTable() {
    const tbody = document.getElementById('adminProductTable');
    if (!tbody) return;

    tbody.innerHTML = products.map(p => `
        <tr class="hover:bg-brand-border/40">
            <td class="p-3 flex items-center gap-2"><img src="${p.image}" class="w-8 h-8 rounded"><span class="font-bold text-white">${p.title}</span></td>
            <td class="p-3 text-gray-400">${formatCategoryName(p.category)}</td>
            <td class="p-3 text-brand-neon">R$ ${Number(p.price).toFixed(2).replace('.', ',')}</td>
            <td class="p-3 text-white">${p.stock} un</td>
            <td class="p-3">
                <button onclick="openEditProductModal(${p.id})" class="mr-2 text-brand-cyan hover:text-white"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteProduct(${p.id})" class="text-red-500 hover:text-white"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openAddProductModal() {
    document.getElementById('formProductId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('adminModalTitle').innerText = "Novo Produto";
    document.getElementById('adminProductModal').classList.remove('hidden');
}

function openEditProductModal(id) {
    const p = products.find(prod => prod.id == id);
    if (!p) return;
    document.getElementById('formProductId').value = p.id;
    document.getElementById('formTitle').value = p.title;
    document.getElementById('formCategory').value = p.category;
    document.getElementById('formPrice').value = p.price;
    document.getElementById('formStock').value = p.stock;
    document.getElementById('formImage').value = p.image;
    document.getElementById('formDescription').value = p.description;

    document.getElementById('adminModalTitle').innerText = "Editar Produto";
    document.getElementById('adminProductModal').classList.remove('hidden');
}

function closeAdminProductModal() {
    document.getElementById('adminProductModal').classList.add('hidden');
}

async function handleProductFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('formProductId').value;
    const pData = {
        title: document.getElementById('formTitle').value,
        category: document.getElementById('formCategory').value,
        price: parseFloat(document.getElementById('formPrice').value),
        stock: parseInt(document.getElementById('formStock').value),
        image: document.getElementById('formImage').value,
        description: document.getElementById('formDescription').value
    };

    const url = id ? `/api/produtos/${id}` : '/api/produtos';
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pData)
        });

        if (response.ok) {
            showToast(id ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!");
            await loadProductsFromAPI();
            renderAdminTable();
            updateAdminMetrics();
            closeAdminProductModal();
        } else {
            showToast("Erro ao salvar produto.", "error");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        showToast("Erro de comunicação com o servidor.", "error");
    }
}

async function deleteProduct(id) {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
        try {
            const response = await fetch(`/api/produtos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showToast("Produto excluído com sucesso!", "error");
                await loadProductsFromAPI();
                renderAdminTable();
                updateAdminMetrics();
            } else {
                showToast("Erro ao excluir produto.", "error");
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
        }
    }
}

function filterAdminTable() {
    const q = document.getElementById('adminSearchInput').value.toLowerCase();
    document.querySelectorAll('#adminProductTable tr').forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
}

/* ==========================================================================
   5. LÓGICA DE AUTENTICAÇÃO E CADASTRO (login.html)
   ========================================================================== */
function setupAuthListeners() {
    // Cadastro
    const formCadastro = document.getElementById('formCadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async function(event) {
            event.preventDefault();

            const usuario = {
                nomeCompleto: document.getElementById('nome').value,
                email: document.getElementById('email').value,
                senha: document.getElementById('senha').value
            };

            try {
                const resposta = await fetch('/api/usuarios/cadastrar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(usuario)
                });

                if (resposta.ok) {
                    alert("Cadastro realizado e salvo no Oracle com sucesso!");
                    window.location.reload();
                } else {
                    alert("Erro ao realizar o cadastro.");
                }
            } catch (erro) {
                console.error("Erro na requisição:", erro);
                alert("Erro de comunicação com o servidor.");
            }
        });
    }

    // Login
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async function(event) {
            event.preventDefault();

            const credenciais = {
                email: document.getElementById('loginEmail').value,
                senha: document.getElementById('loginSenha').value
            };

            try {
                const resposta = await fetch('/api/usuarios/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credenciais)
                });

                if (resposta.ok) {
                    const usuario = await resposta.json();
                    localStorage.setItem('drop_user_name', usuario.nomeCompleto);
                    window.location.href = "index.html";
                } else {
                    alert("E-mail ou senha inválidos, ou utilizador não cadastrado!");
                }
            } catch (erro) {
                console.error("Erro na requisição:", erro);
                alert("Erro de comunicação com o servidor.");
            }
        });
    }
}