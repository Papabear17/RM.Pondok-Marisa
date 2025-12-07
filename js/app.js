// Logika untuk halaman pelanggan (dashboard, keranjang, pembayaran)

let menus = [];
let cart = [];
let latestOrderId = null;

function switchTab(targetId) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.toggle("active", btn.dataset.target === targetId));
  document
    .querySelectorAll(".tab-section")
    .forEach((sec) => sec.classList.toggle("active", sec.id === targetId));
}

function renderMenuList() {
  const listEl = document.getElementById("menu-list");
  const search = document.getElementById("search-input").value.toLowerCase();
  const category = document.getElementById("category-filter").value;

  listEl.innerHTML = "";

  const filtered = menus.filter((m) => {
    const matchSearch =
      !search ||
      m.name.toLowerCase().includes(search) ||
      (m.description || "").toLowerCase().includes(search);
    const matchCat = category === "all" || m.category === category;
    return matchSearch && matchCat;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = "<p>Tidak ada menu yang cocok.</p>";
    return;
  }

  filtered.forEach((m) => {
    const card = document.createElement("article");
    card.className = "card";
    const imgSrc =
      m.imageDataUrl ||
      "https://via.placeholder.com/400x250.png?text=Menu+Pondok+Marisa";
    card.innerHTML = `
      <img src="${imgSrc}" alt="${m.name}" />
      <div class="card-body">
        <h3 class="card-title">${m.name}</h3>
        <div class="card-price">${formatRupiah(m.price)}</div>
        <p class="card-desc">${m.description || ""}</p>
        <button class="btn primary small">Tambah ke Keranjang</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => addToCart(m.id));
    listEl.appendChild(card);
  });
}

function addToCart(menuId) {
  const existing = cart.find((c) => c.menuId === menuId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ menuId, qty: 1 });
  }
  setCart(cart);
  renderCart();
  switchTab("cart-section");
}

function renderCart() {
  const emptyEl = document.getElementById("cart-empty");
  const table = document.getElementById("cart-table");
  const tbody = table.querySelector("tbody");
  const summary = document.getElementById("cart-summary");
  const totalItemsEl = document.getElementById("cart-total-items");
  const totalPriceEl = document.getElementById("cart-total-price");

  if (!cart || cart.length === 0) {
    emptyEl.classList.remove("hidden");
    table.classList.add("hidden");
    summary.classList.add("hidden");
    return;
  }

  emptyEl.classList.add("hidden");
  table.classList.remove("hidden");
  summary.classList.remove("hidden");

  tbody.innerHTML = "";
  let totalItems = 0;
  let totalPrice = 0;

  cart.forEach((item) => {
    const menu = menus.find((m) => m.id === item.menuId);
    if (!menu) return;
    const subtotal = menu.price * item.qty;
    totalItems += item.qty;
    totalPrice += subtotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${menu.name}</td>
      <td>${formatRupiah(menu.price)}</td>
      <td>
        <input type="number" min="1" value="${item.qty}" style="width:60px" />
      </td>
      <td>${formatRupiah(subtotal)}</td>
      <td>
        <button class="btn small danger">Hapus</button>
      </td>
    `;
    const qtyInput = tr.querySelector("input");
    qtyInput.addEventListener("change", () => {
      const val = parseInt(qtyInput.value, 10) || 1;
      item.qty = Math.max(1, val);
      setCart(cart);
      renderCart();
    });
    tr.querySelector("button").addEventListener("click", () => {
      cart = cart.filter((c) => c !== item);
      setCart(cart);
      renderCart();
    });
    tbody.appendChild(tr);
  });

  totalItemsEl.textContent = totalItems;
  totalPriceEl.textContent = formatRupiah(totalPrice);
}

function renderPaymentSection() {
  const warning = document.getElementById("payment-warning");
  const itemsEl = document.getElementById("payment-items");
  const totalEl = document.getElementById("payment-total-price");

  if (!cart || cart.length === 0) {
    warning.classList.remove("hidden");
    itemsEl.innerHTML = "";
    totalEl.textContent = formatRupiah(0);
    return;
  }
  warning.classList.add("hidden");

  itemsEl.innerHTML = "";
  let total = 0;
  cart.forEach((item) => {
    const menu = menus.find((m) => m.id === item.menuId);
    if (!menu) return;
    const subtotal = menu.price * item.qty;
    total += subtotal;
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${menu.name} x${item.qty}</span>
      <span>${formatRupiah(subtotal)}</span>
    `;
    itemsEl.appendChild(li);
  });

  totalEl.textContent = formatRupiah(total);
}

function renderPaymentInfo(method) {
  const info = document.getElementById("payment-info");
  if (method === "kasir") {
    info.innerHTML = `
      <p>Silakan tunjukkan nomor pesanan ke kasir dan lakukan pembayaran tunai di kasir.</p>
    `;
  } else if (method === "qris") {
    const qrisSrc =
      getQrisImage() ||
      "https://via.placeholder.com/200x200.png?text=QRIS+RM+Pondok+Marisa";
    info.innerHTML = `
      <p>Scan QRIS berikut menggunakan aplikasi pembayaran pilihan Anda.</p>
      <div style="margin-top:0.5rem;text-align:center;">
        <img src="${qrisSrc}" alt="QRIS" style="max-width:200px;width:100%;border-radius:0.75rem;border:1px solid #e5e7eb;" />
      </div>
    `;
  } else if (method === "transfer") {
    info.innerHTML = `
      <p>Lakukan transfer ke rekening berikut:</p>
      <ul style="padding-left:1rem;font-size:0.9rem;">
        <li>Bank BCA - 1234567890 a.n. RM PONDOK MARISA</li>
        <li>Bank BRI - 9876543210 a.n. RM PONDOK MARISA</li>
      </ul>
      <p>Setelah transfer, tunjukkan bukti ke kasir untuk konfirmasi.</p>
    `;
  }
}

function createOrder(paymentMethod, customerName) {
  if (!cart || cart.length === 0) return null;
  const methodLabel =
    paymentMethod === "kasir"
      ? "Kasir / Tunai"
      : paymentMethod === "qris"
      ? "QRIS"
      : "Transfer Bank";

  let total = 0;
  const items = cart.map((item) => {
    const menu = menus.find((m) => m.id === item.menuId);
    if (!menu) return null;
    const subtotal = menu.price * item.qty;
    total += subtotal;
    return {
      menuId: menu.id,
      name: menu.name,
      price: menu.price,
      qty: item.qty,
    };
  }).filter(Boolean);

  const id = generateOrderId();
  const order = {
    id,
    items,
    total,
    paymentMethod,
    paymentMethodLabel: methodLabel,
    customerName: customerName || "",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const orders = getOrders();
  orders.push(order);
  setOrders(orders);
  latestOrderId = id;
  cart = [];
  setCart(cart);
  
  // Dispatch event for real-time updates
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
  
  return order;
}

document.addEventListener("DOMContentLoaded", () => {
  // Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      switchTab(target);
      if (target === "cart-section") {
        renderCart();
      } else if (target === "payment-section") {
        renderPaymentSection();
      }
    });
  });

  menus = ensureSampleMenus();
  cart = getCart();

  // Listen for menu updates from admin
  window.addEventListener('menusUpdated', (event) => {
    menus = event.detail;
    renderMenuList();
  });

  // Listen for cart updates
  window.addEventListener('cartUpdated', (event) => {
    cart = event.detail;
    renderCart();
    renderPaymentSection();
  });

  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  if (searchInput) searchInput.addEventListener("input", renderMenuList);
  if (categoryFilter) categoryFilter.addEventListener("change", renderMenuList);

  renderMenuList();
  renderCart();
  renderPaymentSection();
  renderPaymentInfo("kasir");

  const goToPaymentBtn = document.getElementById("go-to-payment");
  if (goToPaymentBtn) {
    goToPaymentBtn.addEventListener("click", () => {
      switchTab("payment-section");
      renderPaymentSection();
    });
  }

  document
    .querySelectorAll('input[name="payment-method"]')
    .forEach((radio) => {
      radio.addEventListener("change", () => {
        renderPaymentInfo(radio.value);
      });
    });

  const confirmBtn = document.getElementById("confirm-order");
  const successBox = document.getElementById("order-success");
  const orderIdSpan = document.getElementById("order-id");

  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      const nameInput = document.getElementById("customer-name");
      const customerName = nameInput ? nameInput.value.trim() : "";
      if (!customerName) {
        alert("Silakan isi nama pemesan terlebih dahulu untuk memverifikasi pesanan.");
        if (nameInput) nameInput.focus();
        return;
      }
      const method = document.querySelector(
        'input[name="payment-method"]:checked'
      )?.value;
      if (!method) return;
      const order = createOrder(method, customerName);
      if (!order) return;
      renderCart();
      renderPaymentSection();
      orderIdSpan.textContent = order.id;
      successBox.classList.remove("hidden");
    });
  }

  const printLatestBtn = document.getElementById("print-latest-receipt");
  if (printLatestBtn) {
    printLatestBtn.addEventListener("click", () => {
      const orders = getOrders();
      const order =
        orders.find((o) => o.id === latestOrderId) || orders[orders.length - 1];
      if (!order) return;
      const template = getReceiptTemplate();
      const struk = renderReceipt(order, template);
      openPrintWindow(struk);
    });
  }
});


