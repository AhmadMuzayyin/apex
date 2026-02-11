// ============================================
// MASTER DATA TYPES
// ============================================

export interface Tahap {
    id: string;
    nama_tahap: string;
    urutan: number;
    tanggal_mulai: string; // ISO date string '2026-02-01'
    tanggal_selesai: string; // ISO date string '2026-02-07'
    status: 'draft' | 'aktif' | 'selesai'; // draft=belum dimulai, aktif=sedang berjalan, selesai=sudah lewat
    created_at: string;
    updated_at?: string;
}

export interface Materi {
    id: string;
    nama_materi: string;
    skt: number;
    created_at: string;
    updated_at?: string;
}

export interface Bobot {
    id: string;
    predikat: string;
    bobot: number;
    nilai_min: number;
    nilai_max: number;
}

export interface Lencana {
    id: string;
    nama_lencana: string;
    pencapaian: string;
    nilai_min: number;
    icon_url?: string;
    created_at: string;
    updated_at?: string;
}

export interface Kelompok {
    id: string;
    nama_kelompok: string;
    created_at: string;
    updated_at?: string;
}

export interface Siswa {
    id: string;
    no_induk: string;
    nama_lengkap: string;
    kelompok_id: string;
    angkatan: number;
    created_at: string;
    updated_at?: string;
}

export interface User {
    id: string;
    code: string; // no_induk untuk siswa, username untuk admin
    role: 'admin' | 'siswa';
    password_hash: string;
    siswa_id?: string;
    nama: string;
    last_login?: string;
    created_at: string;
    updated_at?: string;
}

// ============================================
// JADWAL & ABSENSI
// ============================================

export interface Jadwal {
    id: string;
    tanggal: string; // ISO date string '2026-02-03' (specific date, not day name)
    tahap_id: string;
    materi_id: string;
    kelompok_id: string;
    jam_mulai: string;
    jam_selesai: string;
    status: 'scheduled' | 'berlangsung' | 'selesai' | 'dibatalkan';
    created_at: string;
    updated_at?: string;
}

export interface Libur {
    id: string;
    tipe: 'tanggal' | 'hari'; // tanggal = specific date, hari = recurring day
    nilai: string; // ISO date string untuk tipe tanggal, day name untuk tipe hari (Senin, Selasa, dst)
    keterangan: string;
    scope: 'global' | 'tahap'; // global = apply to all tahap, tahap = specific tahap only
    tahap_ids?: string[]; // if scope='tahap', list of tahap IDs this libur applies to
    created_at: string;
    updated_at?: string;
}

export interface Absensi {
    id: string;
    jadwal_id: string;
    siswa_id: string;
    tanggal: string;
    status: 'hadir' | 'sakit' | 'izin' | 'alpha';
    metode: 'qrcode' | 'manual';
    waktu_scan?: string;
    keterangan?: string;
    created_at: string;
}

// ============================================
// NILAI
// ============================================

export interface NilaiHarian {
    id: string;
    jadwal_id: string; // required - reference to specific jadwal (date-based)
    siswa_id: string;
    tahap_id: string;
    materi_id: string;
    kelompok_id: string;
    pertemuan_ke: number; // auto-increment based on materi_id count
    nilai: number;
    keterangan?: string;
    tanggal_input: string;
    created_at: string;
}

export interface NilaiUlangan {
    id: string;
    siswa_id: string;
    tahap_id: string;
    materi_id: string;
    kelompok_id: string;
    nilai: number;
    keterangan?: string;
    tanggal_input: string;
    created_at: string;
}

export interface NilaiMateri {
    id: string;
    siswa_id: string;
    tahap_id: string;
    materi_id: string;
    rata_harian: number;
    nilai_ulangan: number;
    nilai_total: number;
    bobot: number;
    predikat: string;
    status_kkm: boolean;
    lencana_id?: string;
    generated_at: string;
}

export interface NilaiIPT {
    id: string;
    siswa_id: string;
    tahap_id: string;
    total_skt: number;
    total_bobot_x_skt: number;
    ipt: number;
    generated_at: string;
}

export interface NilaiIPK {
    id: string;
    siswa_id: string;
    total_tahap: number;
    total_ipt: number;
    ipk: number;
    predikat: string;
    generated_at: string;
}

// ============================================
// JAM TAMBAHAN
// ============================================

export interface JamTambahan {
    id: string;
    siswa_id: string;
    tahap_id: string;
    materi_id: string;
    nilai_awal: number;
    jumlah_menit: number;
    nilai_tambahan?: number;
    status: 'pending' | 'selesai';
    keterangan?: string;
    created_at: string;
    updated_at?: string;
}

export interface LencanaSiswa {
    id: string;
    siswa_id: string;
    lencana_id: string;
    tahap_id: string;
    materi_id: string;
    nilai: number;
    tanggal_dapat: string;
}

// ============================================
// DISPLAY TYPES (dengan relasi)
// ============================================

export interface SiswaWithRelations extends Siswa {
    kelompok?: Kelompok;
    user?: User;
}

export interface JadwalWithRelations extends Jadwal {
    tahap?: Tahap;
    materi?: Materi;
    kelompok?: Kelompok;
}

export interface NilaiHarianWithRelations extends NilaiHarian {
    siswa?: Siswa;
    tahap?: Tahap;
    materi?: Materi;
}
