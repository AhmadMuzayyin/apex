# 🎓 HAQY UAM - Sistem Manajemen Akademik

Sistem Manajemen Akademik berbasis Next.js dengan fitur QR Code Absensi dan Penilaian Terintegrasi untuk lembaga pendidikan.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38bdf8)](https://tailwindcss.com/)

## ✨ Fitur Utama

### 🎯 **Manajemen Akademik**
- ✅ **Data Master**: Kelompok, Siswa, Materi, Tahap, Jadwal
- ✅ **Penilaian**: Nilai Harian & Ulangan dengan validasi absensi
- ✅ **Laporan**: Per Siswa, Per Kelompok, Ranking dengan IPT/IPK
- ✅ **Jam Tambahan**: Sistem remedial otomatis dengan replacement logic

### 📱 **Absensi QR Code (POS-Style)**
- ✅ **QR Code Generator**: Generate QR per siswa dengan download/print
- ✅ **Scanner Real-time**: Auto-detect jadwal aktif (support midnight crossing)
- ✅ **Workflow Terintegrasi**: Scan → Absensi → Input Nilai (modal popup)
- ✅ **Validasi Ketat**: Nilai > 0 hanya untuk siswa hadir

### 📊 **Sistem Penilaian**
- ✅ **Input Otomatis**: Berdasarkan jadwal aktif hari ini
- ✅ **Input Manual**: Untuk tanggal/jadwal yang terlewat
- ✅ **Perhitungan IP**: IP = (Rata Harian × 60%) + (Rata Ulangan × 40%)
- ✅ **Jam Tambahan**: Nilai remedial REPLACE rata harian (bukan ditambahkan)

### 👨‍🎓 **Portal Siswa**
- ✅ Dashboard nilai real-time
- ✅ Histori jam tambahan
- ✅ Data prestasi
- ✅ Authentication & authorization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Firebase Project (Firestore + Authentication)

### Installation

1. **Clone repository**
```bash
git clone git@github.com:AhmadMuzayyin/apex.git
cd apex
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**

Buat file `.env.local` di root folder:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Run development server**
```bash
npm run dev
```

5. **Open browser**
```
http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## 📁 Struktur Folder

```
haqy-uam-nextjs/
├── src/
│   ├── app/                    # App Router (Next.js 13+)
│   │   ├── admin/             # Admin Dashboard
│   │   │   ├── absensi/       # QR Scanner & Absensi
│   │   │   ├── data/          # Data Master (Siswa, Jadwal, dll)
│   │   │   ├── jam-tambahan/  # Remedial Management
│   │   │   ├── laporan/       # Reports & Analytics
│   │   │   └── penilaian/     # Nilai Harian & Ulangan
│   │   ├── student/           # Student Portal
│   │   ├── api/               # API Routes
│   │   └── login/             # Authentication
│   ├── components/            # Reusable Components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── NilaiInputModal.tsx
│   │   ├── QRCodeGenerator.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/              # React Contexts
│   │   └── AuthContext.tsx    # Authentication state
│   ├── lib/                   # Utilities
│   │   ├── calculations.ts    # IP/IPT/IPK calculations
│   │   ├── firebase.ts        # Firebase config
│   │   └── helpers.ts         # Helper functions
│   ├── services/              # Business Logic
│   │   └── masterDataService.ts
│   ├── types/                 # TypeScript types
│   │   └── firestore.ts
│   └── middleware.ts          # Auth middleware
├── public/                    # Static files
├── .env.local                 # Environment variables (gitignored)
└── package.json
```

## 🎯 Fitur Detail

### 1. **QR Code Absensi (POS-Style Workflow)**

**Flow:**
```
1. Admin buka halaman Absensi
2. Sistem auto-detect jadwal aktif (toleransi 30 menit)
3. Scanner otomatis aktif
4. Scan QR siswa → Catat absensi + Buka modal input nilai
5. Input nilai → Save → Scanner resume otomatis
```

**Key Features:**
- ✅ Midnight crossing support (jadwal 20:00-00:40)
- ✅ Camera cleanup on navigation
- ✅ Pre-fill nilai jika sudah ada data
- ✅ Modal title berubah: "Input" vs "Update"

### 2. **Validasi Absensi pada Penilaian**

**Aturan:**
```typescript
if (nilai > 0 && siswa.status !== 'hadir') {
  ❌ Block input
  ❌ Show toast error
  ❌ Disable form field
}
```

**Visual Indicators:**
- Siswa hadir: Form normal (enabled)
- Siswa tidak hadir: Form disabled + abu-abu + badge status + warning

### 3. **Perhitungan Nilai (Calculation Logic)**

**IP (Indeks Prestasi per Materi):**
```typescript
// Tanpa Jam Tambahan
IP = (Σ nilai_harian / n × 0.6) + (Σ nilai_ulangan / m × 0.4)

// Dengan Jam Tambahan (REPLACEMENT)
IP = (nilai_jam_tambahan × 0.6) + (Σ nilai_ulangan / m × 0.4)
```

**IPT (Indeks Prestasi Tahap):**
```typescript
IPT = Σ IP_materi / jumlah_materi
```

**IPK (Indeks Prestasi Keseluruhan):**
```typescript
IPK = Σ IPT / jumlah_tahap
```

**Kriteria Jam Tambahan:**
```typescript
if ((avgDaily + avgUlangan) / 2 < 40) {
  trigger_jam_tambahan = true;
}
```

### 4. **Input Nilai Dual Mode**

**Tab "Input Otomatis":**
- Auto-select jadwal hari ini
- Filter siswa yang hadir (jika dari scan)
- Disabled jika dari scan page
- Auto-redirect back after save

**Tab "Input Manual":**
- Pilih tanggal, kelompok, tahap, materi
- Untuk jadwal yang terlewat
- Validasi absensi based on date
- No jadwal_id (empty string)

## 🔐 Authentication

**Admin:**
- Email/Password (Firebase Auth)
- Protected routes dengan middleware
- Redirect to /login if not authenticated

**Student:**
- Login dengan No Induk + Password
- View-only access
- Dashboard nilai & prestasi

## 📦 Dependencies

### Core
- **Next.js 16.1.6** - React framework with App Router
- **TypeScript 5.0** - Type safety
- **Firebase** - Backend (Firestore + Auth)
- **React 19** - UI library

### UI Components
- **shadcn/ui** - Component library
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **Radix UI** - Headless components

### Features
- **qrcode.react** - QR Code generation
- **@yudiel/react-qr-scanner** - QR Scanner
- **date-fns** - Date manipulation
- **sonner** - Toast notifications

## 🧪 Testing

### Manual Testing Checklist

**Absensi QR:**
- [ ] Generate QR untuk siswa
- [ ] Scan QR di jadwal aktif
- [ ] Modal input nilai muncul
- [ ] Save nilai → scanner resume
- [ ] Camera cleanup on back

**Penilaian:**
- [ ] Input nilai untuk siswa hadir ✅
- [ ] Block input untuk siswa tidak hadir ❌
- [ ] Validasi range 0-100
- [ ] Tab manual dengan tanggal lama

**Laporan:**
- [ ] Per siswa: IP per materi, IPT per tahap, IPK
- [ ] Per kelompok: Table all students/tahaps
- [ ] Ranking: Sort by IPK DESC
- [ ] Jam tambahan: +JT indicator

## 🐛 Known Issues & Quirks

1. **Middleware Deprecation Warning**
   - Next.js 16 recommends "proxy" over "middleware"
   - Non-blocking, works fine

2. **QRCodeCanvas Import**
   - Must use named import: `import { QRCodeCanvas } from 'qrcode.react'`
   - No default export available

3. **Scanner Camera**
   - Requires `facingMode: 'environment'` for back camera
   - Must call `setScanning(false)` before navigation

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key | ✅ |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | ✅ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | ✅ |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage Bucket | ✅ |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID | ✅ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | ✅ |

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

### Environment Variables on Vercel
Add all `NEXT_PUBLIC_*` variables in Vercel dashboard → Settings → Environment Variables

## 📄 License

MIT License - feel free to use for educational purposes

## 👨‍💻 Developer

**Ahmad Muzayyin**
- GitHub: [@AhmadMuzayyin](https://github.com/AhmadMuzayyin)
- Repository: [apex](https://github.com/AhmadMuzayyin/apex)

## 🙏 Acknowledgments

- Next.js Team for the amazing framework
- shadcn for the beautiful UI components
- Firebase for the backend infrastructure
- All contributors and testers

---

**Built with ❤️ using Next.js 16 + TypeScript + Firebase**

Last Updated: February 11, 2026
