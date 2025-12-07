// Util umum untuk seluruh aplikasi

const STORAGE_KEYS = {
  MENUS: "pm_menus",
  CART: "pm_cart",
  ORDERS: "pm_orders",
  RECEIPT_TEMPLATE: "pm_receipt_template",
  ADMIN_LOGGED_IN: "pm_admin_logged_in",
  QRIS_IMAGE: "pm_qris_image",
};

function getQrisImage() {
  return localStorage.getItem(STORAGE_KEYS.QRIS_IMAGE) || "";
}

function setQrisImage(dataUrl) {
  if (!dataUrl) {
    localStorage.removeItem(STORAGE_KEYS.QRIS_IMAGE);
  } else {
    localStorage.setItem(STORAGE_KEYS.QRIS_IMAGE, dataUrl);
  }
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType || "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Gagal membaca storage", key, e);
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Gagal menyimpan storage", key, e);
  }
}

function generateOrderId() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    "PM-" +
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    "-" +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

function ensureSampleMenus() {
  let menus = loadFromStorage(STORAGE_KEYS.MENUS, []);
  if (!menus || menus.length === 0) {
    menus = [
      {
        id: "m1",
        name: "Ayam Bakar Marisa",
        category: "makanan",
        price: 25000,
        description: "Ayam bakar bumbu khas Pondok Marisa dengan sambal pedas.",
        imageDataUrl: "",
      },
      {
        id: "m2",
        name: "Ikan Goreng Rica-Rica",
        category: "makanan",
        price: 28000,
        description: "Ikan goreng renyah dengan sambal rica-rica khas Manado.",
        imageDataUrl: "",
      },
      {
        id: "m3",
        name: "Es Teh Manis",
        category: "minuman",
        price: 6000,
        description: "Teh hitam dingin dengan rasa manis yang pas.",
        imageDataUrl: "",
      },
      {
        id: "m4",
        name: "Jus Alpukat",
        category: "minuman",
        price: 15000,
        description: "Jus alpukat kental dengan susu coklat.",
        imageDataUrl: "",
      },
    ];
    saveToStorage(STORAGE_KEYS.MENUS, menus);
  }
  return menus;
}

function getMenus() {
  return loadFromStorage(STORAGE_KEYS.MENUS, []);
}

function setMenus(menus) {
  saveToStorage(STORAGE_KEYS.MENUS, menus);
  // Dispatch event for real-time updates
  window.dispatchEvent(new CustomEvent('menusUpdated', { detail: menus }));
}

function getCart() {
  return loadFromStorage(STORAGE_KEYS.CART, []);
}

function setCart(cart) {
  saveToStorage(STORAGE_KEYS.CART, cart);
}

function getOrders() {
  return loadFromStorage(STORAGE_KEYS.ORDERS, []);
}

function setOrders(orders) {
  saveToStorage(STORAGE_KEYS.ORDERS, orders);
  // Dispatch event for real-time updates
  window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: orders }));
}

function getReceiptTemplate() {
  const existing = localStorage.getItem(STORAGE_KEYS.RECEIPT_TEMPLATE);
  if (existing) {
    return existing;
  }
  const defaultTemplate = `
RM. PONDOK MARISA
Jl. Contoh Alamat No. 123
------------------------------
No Pesanan : {{orderId}}
Tanggal    : {{date}}
Nama       : {{customerName}}
Metode     : {{paymentMethod}}
------------------------------
{{items}}
------------------------------
TOTAL: {{total}}
Terima kasih atas kunjungan Anda!
`.trim();
  localStorage.setItem(STORAGE_KEYS.RECEIPT_TEMPLATE, defaultTemplate);
  return defaultTemplate;
}

function setReceiptTemplate(template) {
  localStorage.setItem(STORAGE_KEYS.RECEIPT_TEMPLATE, template);
}

function renderReceipt(order, template) {
  const itemsText =
    order.items
      .map(
        (it) =>
          `${it.name} x${it.qty} @ ${formatRupiah(it.price)} = ${formatRupiah(
            it.price * it.qty
          )}`
      )
      .join("\n") || "-";

  return template
    .replace(/{{orderId}}/g, order.id)
    .replace(/{{date}}/g, new Date(order.createdAt).toLocaleString("id-ID"))
    .replace(/{{customerName}}/g, order.customerName || "-")
    .replace(/{{total}}/g, formatRupiah(order.total))
    .replace(/{{paymentMethod}}/g, order.paymentMethodLabel || order.paymentMethod)
    .replace(/{{items}}/g, itemsText);
}

function openPrintWindow(receiptText) {
  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) return;
  win.document.write(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Struk Pesanan</title>
  <style>
    body { font-family: "Courier New", monospace; padding: 12px; font-size: 12px; }
    pre { white-space: pre-wrap; }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <pre>${receiptText.replace(/</g, "&lt;")}</pre>
  <script>window.print();</script>
</body>
</html>
`);
  win.document.close();
}

document.addEventListener("DOMContentLoaded", () => {
  const yearEls = document.querySelectorAll("#year");
  yearEls.forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
});


