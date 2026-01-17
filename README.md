# FlowWave

<div align="center">

# 🌊 FlowWave

### AI-Powered Workflow Automation Platform
**Open Source • Self-Hosted • Free Forever**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/yourusername/flowwave?style=social)](https://github.com/yourusername/flowwave)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()

[Demo](https://flowwave.dev) • [Documentation](#-manual-pengguna-user-guide) • [Support](#-dukungan--donasi)

</div>

---

## 📖 Ringkasan (Overview)

**FlowWave** adalah platform otomatisasi visual yang memungkinkan Anda menghubungkan AI Agent, Database, dan API dalam satu kanvas. Versi terbaru (**RC-1.0**) mendukung:
*   **12+ Template Cerdas** (HR, Legal, Finance, Marketing, dll).
*   **Local AI Support** (Ollama, LM Studio).
*   **BYOK (Bring Your Own Key)** untuk manajemen biaya yang fleksibel.
*   **Simulasi Visual** real-time.

---

## 📘 Manual Pengguna (User Guide)

### 1. Cara Menggunakan Template
FlowWave menyediakan **12 Template Siap Pakai** untuk mempercepat pekerjaan Anda:

*   **👥 HR:** Screening Resume otomatis & Penjadwalan Interview.
*   **⚖️ Legal:** Analisis Risiko pada Kontrak PDF.
*   **🚀 Marketing:** Pembuatan Konten Viral (Tweet) berdasarkan Tren.
*   **💳 Finance:** Approval Pengeluaran dengan OCR Struk.
*   **🎧 Support:** Auto-Reply Email berdasarkan Sentimen Pelanggan.
*   **💾 Data:** Text-to-SQL (Tanya Database dengan bahasa manusia).
*   ...dan banyak lagi.

**Langkah:**
1.  Buka Kanvas Kosong.
2.  Pilih kartu Template dari menu (grid di tengah layar).
3.  Workflow akan otomatis ter-generate. Klik **"Run Workflow"** untuk simulasi.

### 2. BYOK (Bring Your Own Key)
Hemat biaya server dengan menggunakan API Key pengguna sendiri.
*   Saat Anda menambahkan **AI Agent Node**, pilih Provider (OpenAI/Gemini).
*   Masukkan API Key Anda di kolom "API Key (Optional)".
*   Kunci ini akan dienkripsi dan hanya digunakan untuk sesi tersebut.

### 3. Local AI (Ollama / LM Studio)
Jalankan model AI di laptop Anda sendiri (Gratis & Privat).
*   Pastikan Ollama berjalan (`ollama serve`).
*   Pilih Provider **"Local AI"** di Node Inspector.
*   Set Base URL ke `http://localhost:11434/v1`.
*   Masukkan nama model (contoh: `llama3`, `mistral`).

---

## 🛠️ Panduan Developer (Developer Guide)

### Prasyarat
*   Node.js v18+
*   Docker & Docker Compose (untuk produksi)
*   Python (opsional, untuk naskah skrip tambahan)

### Cara Menjalankan (Development)

> **⚠️ PENTING:** Jangan menjalankan `npm run build` saat `npm run dev` sedang aktif. Windows akan mengunci file database (`query_engine.dll`). Matikan server dulu sebelum build!

```bash
# 1. Install Dependencies (TurboRepo)
npm install

# 2. Setup Database (SQLite Default)
npx prisma generate
npm run db:push

# 3. Jalankan Mode Dev (Web: 5173, Server: 3001)
npm run dev
```

### Cara Menjalankan (Production)

Gunakan Docker untuk kestabilan maksimal:

```bash
# Build & Run Container
docker compose up --build -d

# Akses Aplikasi
# Web UI: http://localhost:80
# API: http://localhost:3001
```

### Struktur Arsitektur
*   **apps/web**: React + Vite + ReactFlow (Frontend).
*   **apps/server**: Fastify + Node.js (Backend API).
*   **packages/database**: Prisma ORM schema & client.
*   **packages/connectors**: Logika integrasi (OpenAI, Slack, Email).

---

## 🧪 Metode Uji Coba (Testing Protocols)

Kami menyarankan 3 lapisan pengujian untuk memastikan aplikasi berjalan lancar.

### Cara 1: Uji Coba Simulasi (Visual)
*Cocok untuk: Pengguna Awam / Demo Cepat*
1.  Buka Web UI.
2.  Load template "Marketing: Viral Tweet".
3.  Klik tombol Play (▶).
4.  **Verifikasi:** Lihat apakah garis konektor berubah warna menjadi **Hijau** secara berurutan? Apakah muncul tanda centang "✅" pada setiap node?

### Cara 2: Uji Coba Unit & Integrasi (Automated)
*Cocok untuk: Developer sebelum Commit*
Jalankan perintah berikut di terminal:

```bash
# Menjalankan semua test case
npm test

# Test spesifik untuk API Server
cd apps/server && npm test
```
**Pastikan:** Semua tes menunjukkan status `PASS`.

### Cara 3: Uji Coba Beban (Load Test / Manual)
*Cocok untuk: Validasi Kestabilan Server*
1.  Buat Workflow dengan **Loop** (pengulangan) 50x.
2.  Jalankan Workflow.
3.  Buka Task Manager / Activity Monitor.
4.  **Verifikasi:** Cek penggunaan RAM Server. Pastikan tidak ada kebocoran memori (Memory Leak) dan CPU usage tetap wajar.

---

## 💰 Dukungan & Donasi

FlowWave 100% Gratis & Open Source. Dukungan Anda membantu kami mengembangkan fitur baru.

| Platform | Link |
|----------|------|
| ☕ **Trakteer** | [trakteer.id/flowwave](https://trakteer.id/flowwave) |
| 🎁 **Saweria** | [saweria.co/flowwave](https://saweria.co/flowwave) |
| 🐙 **GitHub Sponsors** | [github.com/sponsors/flowwave](https://github.com/sponsors/flowwave) |

---

<div align="center">
**Made with ❤️ by FlowWave Team**
</div>
