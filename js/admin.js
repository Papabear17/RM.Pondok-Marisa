// Logika untuk panel admin

let adminMenus = [];
let adminOrders = [];
let salesChart = null;

function isAdminLoggedIn() {
  // Check localStorage for persistent login state
  return localStorage.getItem(STORAGE_KEYS.ADMIN_LOGGED_IN) === "true";
}

function setAdminLoggedIn(value) {
  // Use localStorage instead of sessionStorage for persistent login across tabs
  if (value) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, "true");
  } else {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_LOGGED_IN);
  }
}

function logoutAdmin() {
  setAdminLoggedIn(false);
  const loginSection = document.getElementById("admin-login-section");
  const contentSection = document.getElementById("admin-content");
  if (loginSection && contentSection) {
    contentSection.classList.add("hidden");
    loginSection.classList.remove("hidden");
  }
}

function refreshAdminData() {
  adminMenus = getMenus();
  adminOrders = getOrders();
}

function renderAdminMenuTable() {
  const tbody = document.querySelector("#admin-menu-table tbody");
  tbody.innerHTML = "";
  if (!adminMenus || adminMenus.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5">Belum ada menu. Tambahkan menu baru.</td>`;
    tbody.appendChild(tr);
    return;
  }

  adminMenus.forEach((m) => {
    const tr = document.createElement("tr");
    const imgSrc =
      m.imageDataUrl ||
      "https://via.placeholder.com/80x60.png?text=Menu";
    tr.innerHTML = `
      <td><img src="${imgSrc}" alt="${m.name}" style="width:70px;height:50px;object-fit:cover;border-radius:0.4rem;" /></td>
      <td>${m.name}</td>
      <td>${m.category}</td>
      <td>${formatRupiah(m.price)}</td>
      <td>
        <button class="btn small" data-action="edit">Edit</button>
        <button class="btn small danger" data-action="delete">Hapus</button>
      </td>
    `;
    tr.querySelector('[data-action="edit"]').addEventListener("click", () =>
      fillMenuForm(m)
    );
    tr.querySelector('[data-action="delete"]').addEventListener("click", () => {
      if (confirm(`Hapus menu "${m.name}"?`)) {
        adminMenus = adminMenus.filter((x) => x.id !== m.id);
        setMenus(adminMenus);
        renderAdminMenuTable();
      }
    });
    tbody.appendChild(tr);
  });
}

function resetMenuForm() {
  const form = document.getElementById("menu-form");
  form.reset();
  document.getElementById("menu-id").value = "";
  document.getElementById("menu-form-title").textContent = "Tambah Menu";
  const preview = document.getElementById("menu-image-preview");
  preview.classList.add("hidden");
  preview.querySelector("img").src = "";
  // Reset currentImageDataUrl when resetting form
  currentImageDataUrl = "";
}

function fillMenuForm(menu) {
  document.getElementById("menu-id").value = menu.id;
  document.getElementById("menu-name").value = menu.name;
  document.getElementById("menu-category").value = menu.category;
  document.getElementById("menu-price").value = menu.price;
  document.getElementById("menu-description").value = menu.description || "";
  const preview = document.getElementById("menu-image-preview");
  if (menu.imageDataUrl) {
    preview.classList.remove("hidden");
    preview.querySelector("img").src = menu.imageDataUrl;
    // Set currentImageDataUrl for proper handling during form submission
    currentImageDataUrl = menu.imageDataUrl;
  } else {
    preview.classList.add("hidden");
    preview.querySelector("img").src = "";
    currentImageDataUrl = "";
  }
  document.getElementById("menu-form-title").textContent = "Edit Menu";
}

function renderAdminOrdersTable() {
  const tbody = document.querySelector("#admin-orders-table tbody");
  tbody.innerHTML = "";
  if (!adminOrders || adminOrders.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="8">Belum ada pesanan.</td>`;
    tbody.appendChild(tr);
    return;
  }

  adminOrders.forEach((o) => {
    const tr = document.createElement("tr");
    const dateStr = new Date(o.createdAt).toLocaleString("id-ID");
    
    // Create a string listing all ordered items
    const itemsList = o.items.map(item => `${item.name} (${item.qty}x)`).join(", ") || "-";
    
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.customerName || "-"}</td>
      <td>${itemsList}</td>
      <td>${dateStr}</td>
      <td>${o.paymentMethodLabel || o.paymentMethod}</td>
      <td>${formatRupiah(o.total)}</td>
      <td>
        <select data-role="status">
          <option value="pending"${o.status === "pending" ? " selected" : ""}>Pending</option>
          <option value="ready"${o.status === "ready" ? " selected" : ""}>Ready</option>
        </select>
      </td>
      <td>
        <button class="btn small" data-action="print">Cetak Struk</button>
      </td>
    `;
    const statusSelect = tr.querySelector('[data-role="status"]');
    statusSelect.addEventListener("change", () => {
      o.status = statusSelect.value;
      setOrders(adminOrders);
    });
    tr.querySelector('[data-action="print"]').addEventListener("click", () => {
      const template = getReceiptTemplate();
      const struk = renderReceipt(o, template);
      openPrintWindow(struk);
    });
    tbody.appendChild(tr);
  });
}

function groupSales(range) {
  const map = new Map();
  adminOrders.forEach((o) => {
    const d = new Date(o.createdAt);
    let key;
    if (range === "weekly") {
      const firstDay = new Date(d);
      firstDay.setDate(d.getDate() - d.getDay());
      key = firstDay.toISOString().substring(0, 10);
    } else if (range === "monthly") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else {
      key = d.toISOString().substring(0, 10);
    }
    const obj = map.get(key) || { total: 0, count: 0 };
    obj.total += o.total;
    obj.count += 1;
    map.set(key, obj);
  });
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, val]) => ({ period: key, ...val }));
}

function renderSales(range) {
  const data = groupSales(range);
  const ctx = document.getElementById("sales-chart").getContext("2d");

  if (salesChart) {
    salesChart.destroy();
  }

  salesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map((d) => d.period),
      datasets: [
        {
          label: "Total Penjualan (Rp)",
          data: data.map((d) => d.total),
          backgroundColor: "#f97316",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          ticks: {
            callback: (value) => formatRupiah(value),
          },
        },
      },
    },
  });

  const tbody = document.querySelector("#sales-table tbody");
  tbody.innerHTML = "";
  if (data.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="3">Belum ada data penjualan.</td>`;
    tbody.appendChild(tr);
    return;
  }

  data.forEach((d) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.period}</td>
      <td>${d.count}</td>
      <td>${formatRupiah(d.total)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function exportOrdersToCsv() {
  if (!adminOrders || adminOrders.length === 0) {
    alert("Belum ada pesanan untuk diexport.");
    return;
  }
  const header = [
    "No Pesanan",
    "Nama Pemesan",
    "Item Pesanan",
    "Tanggal",
    "Metode Pembayaran",
    "Total",
    "Status",
  ];
  const rows = adminOrders.map((o) => [
    o.id,
    o.customerName || "",
    o.items.map(item => `${item.name} (${item.qty}x)`).join(", ") || "-",
    new Date(o.createdAt).toLocaleString("id-ID"),
    o.paymentMethodLabel || o.paymentMethod,
    o.total,
    o.status,
  ]);

  const csvLines = [header, ...rows]
    .map((row) =>
      row
        .map((value) => {
          const str = String(value ?? "");
          // Escape double quotes
          const escaped = str.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(";")
    )
    .join("\r\n");

  const today = new Date().toISOString().substring(0, 10);
  downloadFile(`laporan_pesanan_${today}.csv`, csvLines, "text/csv;charset=utf-8;");
}

function exportSalesToCsv(range) {
  const data = groupSales(range);
  if (!data || data.length === 0) {
    alert("Belum ada data penjualan untuk diexport.");
    return;
  }
  const header = ["Periode", "Jumlah Transaksi", "Total Penjualan"];
  const rows = data.map((d) => [d.period, d.count, d.total]);

  const csvLines = [header, ...rows]
    .map((row) =>
      row
        .map((value) => {
          const str = String(value ?? "");
          const escaped = str.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(";")
    )
    .join("\r\n");

  const today = new Date().toISOString().substring(0, 10);
  downloadFile(
    `laporan_penjualan_${range}_${today}.csv`,
    csvLines,
    "text/csv;charset=utf-8;"
  );
}

function initReceiptSettings() {
  const template = getReceiptTemplate();
  const textarea = document.getElementById("receipt-template");
  const previewBox = document.getElementById("receipt-preview-box");
  textarea.value = template;

  const sampleOrder = {
    id: "PM-SAMPLE",
    createdAt: new Date().toISOString(),
    total: 75000,
    paymentMethod: "kasir",
    paymentMethodLabel: "Kasir / Tunai",
    customerName: "Contoh Pelanggan",
    items: [
      { name: "Ayam Bakar Marisa", qty: 2, price: 25000 },
      { name: "Es Teh Manis", qty: 1, price: 5000 },
    ],
  };
  previewBox.textContent = renderReceipt(sampleOrder, template);

  document
    .getElementById("receipt-settings-form")
    .addEventListener("submit", (e) => {
      e.preventDefault();
      const newTpl = textarea.value || getReceiptTemplate();
      setReceiptTemplate(newTpl);
      previewBox.textContent = renderReceipt(sampleOrder, newTpl);
      alert("Template struk disimpan.");
    });

  // QRIS settings
  const qrisInput = document.getElementById("qris-image-input");
  const qrisPreview = document.getElementById("qris-image-preview");
  const qrisPreviewImg = qrisPreview.querySelector("img");
  let currentQrisDataUrl = getQrisImage();

  function refreshQrisPreview() {
    if (currentQrisDataUrl) {
      qrisPreviewImg.src = currentQrisDataUrl;
      qrisPreview.classList.remove("hidden");
    } else {
      qrisPreviewImg.src = "";
      qrisPreview.classList.add("hidden");
    }
  }

  refreshQrisPreview();

  qrisInput.addEventListener("change", () => {
    const file = qrisInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      currentQrisDataUrl = e.target.result;
      setQrisImage(currentQrisDataUrl);
      refreshQrisPreview();
      alert("Gambar QRIS disimpan.");
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("btn-save-qris").addEventListener("click", () => {
    if (!currentQrisDataUrl) {
      alert("Silakan pilih gambar QRIS terlebih dahulu.");
      return;
    }
    setQrisImage(currentQrisDataUrl);
    alert("Gambar QRIS disimpan.");
  });

  document.getElementById("btn-clear-qris").addEventListener("click", () => {
    if (!confirm("Hapus gambar QRIS yang tersimpan?")) return;
    currentQrisDataUrl = "";
    setQrisImage("");
    refreshQrisPreview();
  });

  document
    .getElementById("print-sample-receipt")
    .addEventListener("click", () => {
      const tpl = textarea.value || getReceiptTemplate();
      const text = renderReceipt(sampleOrder, tpl);
      openPrintWindow(text);
    });
}

function setupAdminTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.toggle("active", b === btn));
      document
        .querySelectorAll(".tab-section")
        .forEach((sec) => sec.classList.toggle("active", sec.id === target));

      if (target === "admin-sales-section") {
        renderSales(document.getElementById("sales-range").value);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("admin-login-section");
  const contentSection = document.getElementById("admin-content");
  const loginForm = document.getElementById("admin-login-form");
  const loginError = document.getElementById("admin-login-error");

  function showAdminContent() {
    loginSection.classList.add("hidden");
    contentSection.classList.remove("hidden");
    refreshAdminData();
    renderAdminMenuTable();
    renderAdminOrdersTable();
    initReceiptSettings();
    setupAdminTabs();
    document
      .getElementById("sales-range")
      .addEventListener("change", (e) => renderSales(e.target.value));

    // Listen for menu updates from other tabs
    window.addEventListener('menusUpdated', (event) => {
      adminMenus = event.detail;
      renderAdminMenuTable();
    });

    // Listen for order updates from customer pages
    window.addEventListener('ordersUpdated', (event) => {
      adminOrders = event.detail;
      renderAdminOrdersTable();
    });

    const exportOrdersBtn = document.getElementById("btn-export-orders");
    if (exportOrdersBtn) {
      exportOrdersBtn.addEventListener("click", () => exportOrdersToCsv());
    }
    const exportSalesBtn = document.getElementById("btn-export-sales");
    if (exportSalesBtn) {
      exportSalesBtn.addEventListener("click", () =>
        exportSalesToCsv(document.getElementById("sales-range").value)
      );
    }
  }

  if (isAdminLoggedIn()) {
    showAdminContent();
  } else {
    loginSection.classList.remove("hidden");
    contentSection.classList.add("hidden");
  }

  const logoutBtn = document.getElementById("btn-logout-admin");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logoutAdmin();
    });
  }

  // Add event listener for menu image removal
  const removeMenuImageBtn = document.getElementById("btn-remove-menu-image");
  if (removeMenuImageBtn) {
    removeMenuImageBtn.addEventListener("click", () => {
      const preview = document.getElementById("menu-image-preview");
      const previewImg = preview.querySelector("img");
      preview.classList.add("hidden");
      previewImg.src = "";
      currentImageDataUrl = "";
      
      // Also clear the file input
      const menuImageInput = document.getElementById("menu-image");
      if (menuImageInput) {
        menuImageInput.value = "";
      }
    });
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = document.getElementById("admin-username").value.trim();
    const pass = document.getElementById("admin-password").value.trim();
    if (user === "admin" && pass === "1234") {
      setAdminLoggedIn(true);
      loginError.classList.add("hidden");
      showAdminContent();
    } else {
      loginError.textContent = "Username atau password salah.";
      loginError.classList.remove("hidden");
    }
  });

  document.getElementById("btn-new-menu").addEventListener("click", resetMenuForm);

  const menuImageInput = document.getElementById("menu-image");
  const preview = document.getElementById("menu-image-preview");
  const previewImg = preview.querySelector("img");
  let currentImageDataUrl = "";

  menuImageInput.addEventListener("change", () => {
    const file = menuImageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      currentImageDataUrl = e.target.result;
      previewImg.src = currentImageDataUrl;
      preview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("menu-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const idField = document.getElementById("menu-id");
    const name = document.getElementById("menu-name").value.trim();
    const category = document.getElementById("menu-category").value;
    const price = parseInt(document.getElementById("menu-price").value, 10) || 0;
    const description = document.getElementById("menu-description").value.trim();

    let menus = adminMenus.slice();

    if (idField.value) {
      const existing = menus.find((m) => m.id === idField.value);
      if (existing) {
        existing.name = name;
        existing.category = category;
        existing.price = price;
        existing.description = description;
        // Handle image update - if currentImageDataUrl is empty, it means image was removed
        // If it has a value, it means a new image was selected or kept the existing one
        existing.imageDataUrl = currentImageDataUrl;
      }
    } else {
      const newId = "m" + Date.now();
      menus.push({
        id: newId,
        name,
        category,
        price,
        description,
        imageDataUrl: currentImageDataUrl || "",
      });
    }

    adminMenus = menus;
    setMenus(adminMenus);
    currentImageDataUrl = "";
    resetMenuForm();
    renderAdminMenuTable();
    alert("Menu disimpan.");
  });
});


