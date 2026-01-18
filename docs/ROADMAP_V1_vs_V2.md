# Roadmap & Visi: FlowWave v1.0 vs v2.0

Dokumen ini berisi evaluasi jujur terhadap keadaan FlowWave saat ini (v1.0) dan visi strategis untuk evolusi berikutnya (v2.0).

---

## 🧐 Evaluasi FlowWave Versi 1.0 (Current State)

FlowWave v1.0 adalah **"Proof of Concept (PoC) yang Sangat Kuat"**.
Kita berhasil membuktikan bahwa browser bisa menjadi kanvas untuk orkestrasi AI lokal. Namun, sebagai produk *enterprise-grade*, v1.0 masih memiliki keterbatasan fundamental.

| Aspek | Status di v1.0 | Evaluasi Jujur (Kelemahan) |
| :--- | :--- | :--- |
| **Database** | **SQLite** (File based) | Cepat untuk dev, tapi **tidak scalable**. Akan lambat jika dipakai 10+ user bersamaan atau menyimpan ribuan log transaksi. Risiko "database locked". |
| **Keamanan** | **Basic / Single User** | Hampir tidak ada konsep "Multi-User" atau "Role". Siapapun yang akses URL bisa mengubah workflow. Sangat bahaya untuk produksi tim besar. |
| **Penyimpanan** | **Local Disk** | File upload disimpan di folder lokal server. Jika server mati/pindah, data sulit disinkronkan. Tidak support S3/MinIO. |
| **Eksekusi AI** | **Sikronus (Tunggu)** | Workflow dieksekusi real-time di UI. Jika browser ditutup, proses berhenti. Belum ada "Background Worker" yang handal untuk tugas panjang. |
| **Deployment** | **Manual** | Harus `git pull`, build manual. Rawan error konfigurasi di server produksi. |

---

## 🚀 Visi FlowWave Versi 2.0 (The Enterprise Leap)

Visi v2.0 adalah mengubah FlowWave dari "Mainan Developer" menjadi **"Platform Perusahaan yang Serius"**. Kita akan fokus pada **Scalability, Security, & Stability**.

### 1. Fondasi Infrastruktur (The Iron Core)
*   **Migrasi ke PostgreSQL:** Kita akan tinggalkan SQLite. PostgreSQL memungkinkan ribuan transaksi per detik dan fitur JSONB untuk menyimpan struktur workflow yang kompleks.
*   **Redis Caching:** Untuk mempercepat pembacaan status node dan antrian job (queue).

### 2. Keamanan Tingkat Bank (Fort Knox Security)
*   **Multi-Tenancy & RBAC:**
    *   **Admin:** Bisa segalanya.
    *   **Editor:** Bisa edit workflow tapi tidak bisa hapus sistem.
    *   **Viewer:** Hanya bisa lihat stats (untuk bos/klien).
*   **Audit Logs:** Mencatat SIAPA yang mengubah APA dan KAPAN. Penting untuk compliance perusahaan.

### 3. Eksekusi Mandiri (Headless Execution)
*   **Decoupled Worker:** Memisahkan "Otak" (Server) dan "Tangan" (Worker).
*   Jika user menutup browser, workflow **TETAP BERJALAN** di background (server).
*   Kita bisa punya 5 Worker server sekaligus untuk memproses ribuan workflow secara paralel.

### 4. Integrasi Penyimpanan Cloud
*   **S3 Compatible Storage:** Integrasi native ke AWS S3, Google Cloud Storage, atau MinIO (Self-hosted S3).
*   Ini memungkinkan FlowWave memproses file PDF besar tanpa membebani hardisk server utama.

---

## 📋 Rencana Aksi Migrasi (Action Plan)

Berikut adalah tahapan konkret untuk menuju v2.0:

### Fase 1: Database & Backend Refactor (Minggu 1-2)
*   [ ] Ganti Prisma Schema dari SQLite ke **PostgreSQL**.
*   [ ] Implementasi Docker Compose untuk menyertakan container Postgres & Redis.
*   [ ] Buat skrip migrasi data dari v1 ke v2.

### Fase 2: Authentication & Security (Minggu 3)
*   [ ] Pasang **NextAuth.js** atau sistem auth custom berbasis JWT yang kuat.
*   [ ] Buat tabel `Users`, `Roles`, dan `Permissions`.
*   [ ] Kunci API endpoint agar hanya bisa diakses user terautentikasi.

### Fase 3: Smart Worker Engine (Minggu 4)
*   [ ] Implementasi **BullMQ** (Antrian berbasis Redis).
*   [ ] Refactor logika eksekusi node agar bisa berjalan "detached" dari frontend React.

### Fase 4: Cloud & Scalability (Minggu 5)
*   [ ] Tambahkan opsi konfigurasi S3 Bucket di panel Admin.
*   [ ] Buat dokumentasi deployment menggunakan Docker Swarm atau Kubernetes (opsional).

---

## Kesimpulan
Versi 1.0 adalah tentang **"Bisa Jalan"**.
Versi 2.0 adalah tentang **"Bisa Diandalkan 24 Jam Non-Stop"**.

Apakah Anda setuju dengan roadmap ini? Jika ya, kita bisa mulai dari langkah paling krusial: **Persiapan Migrasi Database ke PostgreSQL**.
