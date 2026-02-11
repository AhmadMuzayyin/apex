RANCANGAN APLIKASI SISTEM PENILAIAN SISWA

A. ARSITEKTUR APLIKASI
1. Role & Akses
Admin:

Input semua data master
Input nilai siswa
Lihat laporan lengkap
Manajemen user

Siswa:

Lihat nilai pribadi
Lihat IPT & IPK
Lihat lencana yang didapat
Lihat jam tambahan (jika ada)


B. MENU UTAMA
UNTUK ADMIN:
DASHBOARD
├── DATA MASTER
│   ├── Kelompok
│   ├── Siswa
│   ├── Materi
│   ├── Tahap
│   ├── Bobot (Read Only - sudah fix)
│   └── Lencana
│
├── PENILAIAN
│   ├── Input Nilai Harian
│   ├── Input Nilai Ulangan
│   ├── Proses Nilai Materi (Hitung IP)
│   ├── Proses IPT
│   └── Proses IPK
│
├── JAM TAMBAHAN
│   ├── Daftar Siswa Perlu Jam Tambahan
│   └── Input Jam Tambahan
│
├── LAPORAN
│   ├── Laporan Nilai per Siswa
│   ├── Laporan Nilai per Kelompok
│   ├── Laporan IPT per Tahap
│   ├── Laporan IPK
│   └── Laporan Jam Tambahan
│
└── MANAJEMEN USER
    ├── Daftar User Admin
    └── Daftar User Siswa
UNTUK SISWA:
DASHBOARD
├── NILAI SAYA
│   ├── Nilai Harian
│   ├── Nilai Ulangan
│   └── Nilai Materi (IP)
│
├── PRESTASI
│   ├── IPT per Tahap
│   ├── IPK Keseluruhan
│   └── Lencana yang Didapat
│
└── JAM TAMBAHAN
    └── Jadwal Jam Tambahan

C. FLOW APLIKASI (STEP BY STEP)
TAHAP 1: SETUP DATA MASTER
1.1 Menu: Data Master → Tahap
Fungsi: Input tahap pembelajaran
Form Input:
┌─────────────────────────────────┐
│ TAMBAH TAHAP                    │
├─────────────────────────────────┤
│ Nama Tahap*  : [____________]   │
│ Urutan*      : [____]           │
│                                 │
│ [Simpan]  [Batal]              │
└─────────────────────────────────┘
Tabel Data:
| No | Nama Tahap | Urutan | Aksi        |
|----|------------|--------|-------------|
| 1  | Tahap 1    | 1      | Edit | Hapus|
| 2  | Tahap 2    | 2      | Edit | Hapus|

1.2 Menu: Data Master → Materi
Fungsi: Input materi pembelajaran
Form Input:
┌─────────────────────────────────┐
│ TAMBAH MATERI                   │
├─────────────────────────────────┤
│ Nama Materi* : [____________]   │
│ SKT*         : [2] (default 2)  │
│                                 │
│ [Simpan]  [Batal]              │
└─────────────────────────────────┘
Tabel Data:
| No | Nama Materi | SKT | Aksi        |
|----|-------------|-----|-------------|
| 1  | Membaca     | 2   | Edit | Hapus|
| 2  | Menulis     | 2   | Edit | Hapus|
| 3  | Berhitung   | 2   | Edit | Hapus|

1.3 Menu: Data Master → Lencana
Fungsi: Input lencana pencapaian
Form Input:
┌─────────────────────────────────────┐
│ TAMBAH LENCANA                      │
├─────────────────────────────────────┤
│ Nama Lencana*    : [____________]   │
│ Pencapaian*      : [____________]   │
│ Syarat Nilai Min*: [____]           │
│ Icon*            : [Upload File]    │
│                                     │
│ [Simpan]  [Batal]                  │
└─────────────────────────────────────┘
Tabel Data:
| No | Nama         | Pencapaian       | Nilai Min | Icon | Aksi        |
|----|--------------|------------------|-----------|------|-------------|
| 1  | Bintang Emas | Nilai Sempurna   | 95        | ⭐   | Edit | Hapus|
| 2  | Perak        | Nilai Baik       | 80        | 🥈   | Edit | Hapus|

1.4 Menu: Data Master → Kelompok
Fungsi: Input kelompok belajar
Form Input:
┌─────────────────────────────────┐
│ TAMBAH KELOMPOK                 │
├─────────────────────────────────┤
│ Nama Kelompok* : [____________] │
│                                 │
│ [Simpan]  [Batal]              │
└─────────────────────────────────┘
Tabel Data:
| No | Nama Kelompok  | Jumlah Siswa | Aksi        |
|----|----------------|--------------|-------------|
| 1  | Kelompok A     | 15           | Edit | Hapus|
| 2  | Kelompok B     | 12           | Edit | Hapus|

1.5 Menu: Data Master → Siswa
Fungsi: Input data siswa
Form Input:
┌─────────────────────────────────┐
│ TAMBAH SISWA                    │
├─────────────────────────────────┤
│ Nomor Induk*  : [____________]  │
│ Nama Lengkap* : [____________]  │
│ Kelompok*     : [▼ Pilih]       │
│ Angkatan*     : [2024]          │
│ Password*     : [____________]  │
│                                 │
│ [Simpan]  [Batal]              │
└─────────────────────────────────┘
Tabel Data:
| No | No Induk | Nama        | Kelompok   | Angkatan | Aksi        |
|----|----------|-------------|------------|----------|-------------|
| 1  | 2024001  | Ahmad       | Kelompok A | 2024     | Edit | Hapus|
| 2  | 2024002  | Siti        | Kelompok A | 2024     | Edit | Hapus|
Catatan:

Saat simpan siswa, otomatis dibuatkan akun user dengan:

code = no_induk
role = siswa
password = yang diinput (di-hash)




1.6 Menu: Data Master → Bobot
Fungsi: Lihat tabel bobot (READ ONLY)
Tabel Data:
| Predikat | Bobot | Nilai Min | Nilai Max |
|----------|-------|-----------|-----------|
| AA       | 4.00  | 95        | 100       |
| A        | 3.80  | 85        | 94        |
| BB       | 3.50  | 80        | 84        |
| B        | 3.20  | 70        | 79        |
| CC       | 2.80  | 65        | 69        |
| C        | 2.50  | 40        | 64        |
| E        | 2.00  | 0         | 39        |
Catatan: Data ini sudah fix, tidak bisa diedit

TAHAP 2: INPUT PENILAIAN
2.1 Menu: Penilaian → Input Nilai Harian
Filter:
┌────────────────────────────────────────────┐
│ Tahap*    : [▼ Pilih Tahap]                │
│ Materi*   : [▼ Pilih Materi]               │
│ Kelompok* : [▼ Pilih Kelompok]             │
│             [Tampilkan]                     │
└────────────────────────────────────────────┘
Form Input:
┌─────────────────────────────────────────────────────────┐
│ INPUT NILAI HARIAN                                      │
│ Tahap: Tahap 1 | Materi: Membaca | Kelompok: A         │
├─────────────────────────────────────────────────────────┤
│ Pertemuan Ke: [1] ▼                                     │
│                                                         │
│ | No | No Induk | Nama  | Nilai | Keterangan          |│
│ |----|----------|-------|-------|---------------------|│
│ | 1  | 2024001  | Ahmad | [75]  | [_______________]   |│
│ | 2  | 2024002  | Siti  | [80]  | [_______________]   |│
│ | 3  | 2024003  | Budi  | [70]  | [_______________]   |│
│                                                         │
│ [Simpan Semua]  [Batal]                                │
└─────────────────────────────────────────────────────────┘
Validasi:

Nilai harus 0-100
Tidak bisa input pertemuan yang sama 2 kali untuk siswa yang sama

Riwayat Nilai Harian:
| Siswa  | Pertemuan 1 | Pertemuan 2 | Pertemuan 3 | ... |
|--------|-------------|-------------|-------------|-----|
| Ahmad  | 75          | 80          | -           | -   |
| Siti   | 80          | 85          | -           | -   |

2.2 Menu: Penilaian → Input Nilai Ulangan
Filter:
┌────────────────────────────────────────────┐
│ Tahap*    : [▼ Pilih Tahap]                │
│ Materi*   : [▼ Pilih Materi]               │
│ Kelompok* : [▼ Pilih Kelompok]             │
│             [Tampilkan]                     │
└────────────────────────────────────────────┘
Form Input:
┌─────────────────────────────────────────────────────────┐
│ INPUT NILAI ULANGAN                                     │
│ Tahap: Tahap 1 | Materi: Membaca | Kelompok: A         │
├─────────────────────────────────────────────────────────┤
│ | No | No Induk | Nama  | Nilai | Keterangan          |│
│ |----|----------|-------|-------|---------------------|│
│ | 1  | 2024001  | Ahmad | [90]  | [_______________]   |│
│ | 2  | 2024002  | Siti  | [85]  | [_______________]   |│
│ | 3  | 2024003  | Budi  | [80]  | [_______________]   |│
│                                                         │
│ [Simpan Semua]  [Batal]                                │
└─────────────────────────────────────────────────────────┘
Validasi:

Nilai harus 0-100
1 siswa hanya bisa punya 1 nilai ulangan per materi per tahap


2.3 Menu: Penilaian → Proses Nilai Materi (IP)
Filter:
┌────────────────────────────────────────────┐
│ Tahap*    : [▼ Pilih Tahap]                │
│ Materi*   : [▼ Pilih Materi]               │
│ Kelompok* : [▼ Pilih Kelompok]             │
│             [Proses Perhitungan]            │
└────────────────────────────────────────────┘
Proses yang Terjadi (Backend):
UNTUK SETIAP SISWA:
1. Ambil semua nilai_harian → hitung rata-rata
2. Rata-rata × 60% = komponen_harian
3. Ambil nilai_ulangan × 40% = komponen_ulangan
4. Nilai Total = komponen_harian + komponen_ulangan
5. Cari bobot berdasarkan nilai_total di tabel bobot
6. IP = bobot yang didapat
7. Status KKM = TRUE jika nilai_total ≥ 40, FALSE jika < 40
8. Jika dapat lencana (cek syarat_nilai_min), simpan lencana_id
9. Simpan ke tabel nilai_materi

JIKA Status KKM = FALSE:
10. Buat record di tabel jam_tambahan dengan status 'pending'
Hasil Tampilan:
┌──────────────────────────────────────────────────────────────────┐
│ HASIL PERHITUNGAN IP - TAHAP 1 - MEMBACA                         │
├──────────────────────────────────────────────────────────────────┤
│ | Siswa | Rata² | Ulangan | Total | Bobot | Predikat | Status | │
│ |       | Harian|         |       |       |          | KKM    | │
│ |-------|-------|---------|-------|-------|----------|--------|│
│ | Ahmad | 77.5  | 90      | 82.5  | 3.50  | BB       | ✓ Lulus|│
│ | Siti  | 82.5  | 85      | 83.5  | 3.50  | BB       | ✓ Lulus|│
│ | Budi  | 35    | 40      | 37    | 2.00  | E        | ✗ Tidak|│
│                                                                  │
│ Keterangan:                                                      │
│ - Budi perlu JAM TAMBAHAN (nilai < 40)                          │
└──────────────────────────────────────────────────────────────────┘

2.4 Menu: Penilaian → Proses IPT
Filter:
┌────────────────────────────────────────────┐
│ Tahap*    : [▼ Pilih Tahap]                │
│ Kelompok* : [▼ Pilih Kelompok]             │
│             [Proses IPT]                    │
└────────────────────────────────────────────┘
Proses yang Terjadi:
UNTUK SETIAP SISWA:
1. Ambil semua nilai_materi di tahap yang dipilih
2. Untuk setiap materi: IP × SKT
3. Jumlahkan semua hasil (IP × SKT) = total_bobot_x_skt
4. Jumlahkan semua SKT = total_skt
5. IPT = total_bobot_x_skt ÷ total_skt
6. Simpan ke tabel nilai_ipt
Contoh Perhitungan Detail:
Siswa: Ahmad | Tahap: 1

Materi      | IP   | SKT | IP × SKT
------------|------|-----|----------
Membaca     | 3.50 | 2   | 7.00
Menulis     | 3.80 | 2   | 7.60
Berhitung   | 3.20 | 2   | 6.40
                          ------
Total                     21.00

Total SKT = 6
IPT = 21.00 ÷ 6 = 3.50
Hasil Tampilan:
┌─────────────────────────────────────────────────────────┐
│ HASIL IPT - TAHAP 1 - KELOMPOK A                        │
├─────────────────────────────────────────────────────────┤
│ | No | Siswa | Total SKT | Total (IP×SKT) | IPT      | │
│ |----|-------|-----------|----------------|----------|│
│ | 1  | Ahmad | 6         | 21.00          | 3.50     |│
│ | 2  | Siti  | 6         | 22.80          | 3.80     |│
│ | 3  | Budi  | 6         | 18.60          | 3.10     |│
└─────────────────────────────────────────────────────────┘

2.5 Menu: Penilaian → Proses IPK
Filter:
┌────────────────────────────────────────────┐
│ Kelompok* : [▼ Pilih Kelompok atau Semua]  │
│             [Proses IPK]                    │
└────────────────────────────────────────────┘
Proses yang Terjadi:
UNTUK SETIAP SISWA:
1. Ambil semua IPT dari semua tahap
2. Jumlahkan IPT = total_ipt
3. Hitung jumlah tahap = total_tahap
4. IPK = total_ipt ÷ total_tahap
5. Simpan/Update ke tabel nilai_ipk
Contoh Perhitungan:
Siswa: Ahmad

Tahap 1 IPT = 3.50
Tahap 2 IPT = 3.60
Tahap 3 IPT = 3.70
Tahap 4 IPT = 3.80
-----------------------
Total IPT = 14.60
Total Tahap = 4

IPK = 14.60 ÷ 4 = 3.65
Hasil Tampilan:
┌──────────────────────────────────────────────────────────┐
│ HASIL IPK - KELOMPOK A                                   │
├──────────────────────────────────────────────────────────┤
│ | No | Siswa | Tahap | Total IPT | IPK   | Predikat   | │
│ |----|-------|-------|-----------|-------|------------|│
│ | 1  | Ahmad | 4     | 14.60     | 3.65  | A          |│
│ | 2  | Siti  | 4     | 15.20     | 3.80  | A          |│
│ | 3  | Budi  | 4     | 12.40     | 3.10  | B          |│
└──────────────────────────────────────────────────────────┘

TAHAP 3: JAM TAMBAHAN
3.1 Menu: Jam Tambahan → Daftar Siswa Perlu Jam Tambahan
Filter:
┌────────────────────────────────────────────┐
│ Tahap*    : [▼ Pilih Tahap atau Semua]     │
│ Status*   : [▼ Pending/Selesai/Semua]      │
│             [Tampilkan]                     │
└────────────────────────────────────────────┘
Tabel Data:
| No | Siswa | Tahap   | Materi    | Nilai | Status  | Aksi          |
|----|-------|---------|-----------|-------|---------|---------------|
| 1  | Budi  | Tahap 1 | Membaca   | 37    | Pending | Input Jam     |
| 2  | Dewi  | Tahap 2 | Berhitung | 35    | Pending | Input Jam     |
| 3  | Eko   | Tahap 1 | Menulis   | 38    | Selesai | Lihat Detail  |

3.2 Menu: Jam Tambahan → Input Jam Tambahan
Form Input:
┌─────────────────────────────────────────────┐
│ INPUT JAM TAMBAHAN                          │
├─────────────────────────────────────────────┤
│ Siswa     : Budi                            │
│ Tahap     : Tahap 1                         │
│ Materi    : Membaca                         │
│ Nilai     : 37 (E - Tidak Lulus)            │
│                                             │
│ Jumlah Jam (menit)* : [____]                │
│ Status*             : [▼ Pending/Selesai]   │
│ Keterangan          : [________________]    │
│                                             │
│ [Simpan]  [Batal]                          │
└─────────────────────────────────────────────┘

TAHAP 4: LAPORAN
4.1 Menu: Laporan → Laporan Nilai per Siswa
Filter:
┌────────────────────────────────────────────┐
│ Siswa* : [▼ Pilih Siswa]                   │
│          [Tampilkan]  [Export PDF]          │
└────────────────────────────────────────────┘
Tampilan Laporan:
╔════════════════════════════════════════════════════════╗
║          LAPORAN NILAI SISWA                           ║
╠════════════════════════════════════════════════════════╣
║ Nama     : Ahmad                                       ║
║ No Induk : 2024001                                     ║
║ Kelompok : Kelompok A                                  ║
║ Angkatan : 2024                                        ║
╠════════════════════════════════════════════════════════╣

TAHAP 1
┌────────────────────────────────────────────────────────┐
│ Materi    | Harian | Ulangan | Total | Bobot | IP     │
│-----------|--------|---------|-------|-------|--------|
│ Membaca   | 77.5   | 90      | 82.5  | 3.50  | BB     │
│ Menulis   | 85     | 95      | 89    | 3.80  | A      │
│ Berhitung | 72     | 75      | 73.2  | 3.20  | B      │
└────────────────────────────────────────────────────────┘
IPT Tahap 1: 3.50

TAHAP 2
┌────────────────────────────────────────────────────────┐
│ Materi    | Harian | Ulangan | Total | Bobot | IP     │
│-----------|--------|---------|-------|-------|--------|
│ Membaca   | 80     | 92      | 84.8  | 3.80  | A      │
│ ...       | ...    | ...     | ...   | ...   | ...    │
└────────────────────────────────────────────────────────┘
IPT Tahap 2: 3.60

═══════════════════════════════════════════════════════
IPK KESELURUHAN: 3.65 (Predikat: A)
Lencana: ⭐ Bintang Emas (2), 🥈 Perak (5)
═══════════════════════════════════════════════════════

4.2 Menu: Laporan → Laporan Nilai per Kelompok
Filter:
┌────────────────────────────────────────────┐
│ Kelompok* : [▼ Pilih Kelompok]             │
│ Tahap*    : [▼ Pilih Tahap]                │
│             [Tampilkan]  [Export Excel]     │
└────────────────────────────────────────────┘
Tampilan:
┌──────────────────────────────────────────────────────────┐
│ KELOMPOK A - TAHAP 1                                     │
├──────────────────────────────────────────────────────────┤
│ | Siswa | Membaca | Menulis | Berhitung | IPT  | Rank | │
│ |-------|---------|---------|-----------|------|------|│
│ | Siti  | 3.80    | 4.00    | 3.80      | 3.87 | 1    |│
│ | Ahmad | 3.50    | 3.80    | 3.20      | 3.50 | 2    |│
│ | Budi  | 3.20    | 3.20    | 2.80      | 3.07 | 3    |│
└──────────────────────────────────────────────────────────┘

4.3 Menu: Laporan → Laporan IPK
Filter:
┌────────────────────────────────────────────┐
│ Angkatan* : [▼ Pilih Angkatan atau Semua]  │
│             [Tampilkan]  [Export Excel]     │
└────────────────────────────────────────────┘
Tampilan:
┌─────────────────────────────────────────────────────────┐
│ RANKING IPK - ANGKATAN 2024                             │
├─────────────────────────────────────────────────────────┤
│ | Rank | No Induk | Nama  | Kelompok | IPK  | Predikat|│
│ |------|----------|-------|----------|------|---------|│
│ | 1    | 2024002  | Siti  | A        | 3.87 | A       |│
│ | 2    | 2024005  | Rina  | B        | 3.75 | A       |│
│ | 3    | 2024001  | Ahmad | A        | 3.65 | A       |│
│ | 4    | 2024003  | Budi  | A        | 3.10 | B       |│
└─────────────────────────────────────────────────────────┘

D. TAMPILAN UNTUK SISWA
Dashboard Siswa
╔════════════════════════════════════════════════════════╗
║ Selamat Datang, Ahmad!                                 ║
║ No Induk: 2024001 | Kelompok: A | Angkatan: 2024       ║
╠════════════════════════════════════════════════════════╣

┌────────────────────────────────────────────────────────┐
│ 📊 RINGKASAN PRESTASI                                  │
├────────────────────────────────────────────────────────┤
│ IPK Saat Ini    : 3.65 (Predikat: A)                  │
│ Tahap Terakhir  : Tahap 3                              │
│ IPT Terakhir    : 3.70                                 │
│ Lencana         : 7 lencana                            │
│ Jam Tambahan    : Tidak ada                            │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ 📚 NILAI PER TAHAP                                     │
├────────────────────────────────────────────────────────┤
│ [Tahap 1] [Tahap 2] [Tahap 3] [Tahap 4]              │
│                                                        │
│ Detail Tahap 3:                                        │
│ - Membaca   : 85 (BB - 3.50)                          │
│ - Menulis   : 92 (A - 3.80)                           │
│ - Berhitung : 88 (A - 3.80)                           │
│                                                        │
│ IPT Tahap 3: 3.70                                      │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ 🏆 LENCANA YANG DIDAPAT                                │
├────────────────────────────────────────────────────────┤
│ ⭐ Bintang Emas  - Tahap 1 (Membaca)                  │
│ ⭐ Bintang Emas  - Tahap 2 (Menulis)                  │
│ 🥈 Perak         - Tahap 1 (Berhitung)                │
│ ...                                                    │
└────────────────────────────────────────────────────────┘

E. VALIDASI & ATURAN BISNIS
Aturan Input:

Nilai Harian: Tidak bisa input jika belum ada tahap & materi
Nilai Ulangan: Tidak bisa input jika belum ada nilai harian
Proses IP: Tidak bisa proses jika nilai harian atau ulangan belum lengkap
Proses IPT: Tidak bisa proses jika IP belum dihitung untuk semua materi di tahap tersebut
Proses IPK: Tidak bisa proses jika belum ada IPT

Sistem Notifikasi:

Jika ada siswa nilai < 40 → muncul alert "Siswa perlu jam tambahan"
Jika siswa dapat lencana → muncul notifikasi ke siswa
Jika IPT/IPK sudah diproses → notifikasi ke siswa

untuk proses IP, IPT dan proses IPK harsunya tanpa triger, sistem auto mengenerate data transkip nilai dari setiap siswa baik transkip nilai sementara (pertahap / IPT) atau transkip nilai final akahir tahap IPK. dan harusnya tidak perlu pemrosesan

buat dengan gaya android APP baik di buka di device besar atau kecil tampilannya tetap tampilaan android app


saya ada rencana agar input nilai itu lebih praktis dengan menambahkan data master jadwal akademik, jadi kegiatan setiap tahapan itu terhimpun di jadwal. nanti admin hanya tinggal input  nilai di hari itu otomatis sesuai tahap yang mana, materi yang mana, kelompok yang mana.

untuk jam tambahan jika nilai siswa tidak mencapai kkm minimal (40 dengan bobot 2.50 (C)) prosesnya di otomatiskan jadi ketika input nilai ada materi tersebut dan nilai total nya tidak mencapai kkm maka otomatis siswa di tambahkan jam tambahan dan dengan default 1 jam tambahan, penilaian jam tambahan di tambahkan ke nilai materi dan itu akan menjadi ip juga nanti.

tambahkan juga absensi (harusnya setelah membuat jadwal), absensi kehadiran ini bisa dilakukan dengan scan qrcode atau manual