## Aplikasi Web RM. PONDOK MARISA

Aplikasi sederhana berbasis browser (tanpa server/backend) untuk simulasi:

- **Dashboard pelanggan**: daftar menu, tambah ke keranjang.
- **Keranjang & pembayaran**: ubah jumlah, total, pilih metode (Kasir/Tunai, QRIS, Transfer) dan konfirmasi pesanan.
- **Panel admin**: login, kelola menu (tambah/edit/hapus + upload gambar dari file explorer), lihat dan ubah status pesanan (pending/ready), cetak struk, atur template struk, dan lihat grafik penjualan.

Semua data disimpan di **LocalStorage browser**, jadi:

- Tidak butuh instalasi Node.js atau database.
- Data hanya tersimpan di komputer/browser yang sama.

### Cara Menjalankan

1. Buka folder proyek ini.
2. Klik dua kali `index.html` untuk membuka di browser (disarankan Chrome/Edge).
3. Untuk panel admin, buka `admin.html` atau klik link "Panel Admin" di pojok kanan atas.

### Akun Admin (demo)

- **Username**: `admin`  
- **Password**: `1234`

### Upload Gambar Menu

- Masuk ke `admin.html` → tab **Menu**.
- Klik **Tambah Menu Baru** atau **Edit** pada menu yang sudah ada.
- Pilih file gambar dari **File Explorer** pada input "Gambar Menu".
- Gambar akan disimpan dalam LocalStorage dan langsung muncul di dashboard pelanggan.




