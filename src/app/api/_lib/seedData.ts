import * as bcrypt from 'bcryptjs';

// Data Tahun Akademik
export const TAHUN_AKADEMIK_DATA = [
    {
        tahun: '2025/2026',
        tanggal_mulai: '2025-07-01',
        tanggal_selesai: '2026-06-30',
        status: 'selesai' as const,
    },
    {
        tahun: '2026/2027',
        tanggal_mulai: '2026-07-01',
        tanggal_selesai: '2027-06-30',
        status: 'aktif' as const,
    },
];

// Data Bobot (Fixed - Read Only)
export const BOBOT_DATA = [
    { predikat: 'AA', bobot: 4.0, nilai_min: 95, nilai_max: 100 },
    { predikat: 'A', bobot: 3.8, nilai_min: 85, nilai_max: 94 },
    { predikat: 'BB', bobot: 3.5, nilai_min: 80, nilai_max: 84 },
    { predikat: 'B', bobot: 3.2, nilai_min: 70, nilai_max: 79 },
    { predikat: 'CC', bobot: 2.8, nilai_min: 65, nilai_max: 69 },
    { predikat: 'C', bobot: 2.5, nilai_min: 40, nilai_max: 64 },
    { predikat: 'E', bobot: 2.0, nilai_min: 0, nilai_max: 39 },
];

// Data Tahap (akan di-link ke tahun akademik aktif saat seeding)
export const TAHAP_DATA = [
    {
        nama_tahap: 'Tahap 1',
        urutan: 1,
        tanggal_mulai: '2026-07-01',
        tanggal_selesai: '2026-09-30',
        status: 'selesai' as const,
    },
    {
        nama_tahap: 'Tahap 2',
        urutan: 2,
        tanggal_mulai: '2026-10-01',
        tanggal_selesai: '2026-12-31',
        status: 'selesai' as const,
    },
    {
        nama_tahap: 'Tahap 3',
        urutan: 3,
        tanggal_mulai: '2027-01-01',
        tanggal_selesai: '2027-03-31',
        status: 'aktif' as const,
    },
    {
        nama_tahap: 'Tahap 4',
        urutan: 4,
        tanggal_mulai: '2027-04-01',
        tanggal_selesai: '2027-06-30',
        status: 'draft' as const,
    },
];

// Data Materi (Master Template)
export const MATERI_DATA = [
    { nama_materi: 'Membaca', skt: 2 },
    { nama_materi: 'Menulis', skt: 2 },
    { nama_materi: 'Berhitung', skt: 2 },
    { nama_materi: 'Hafalan', skt: 2 },
    { nama_materi: 'Tilawah', skt: 2 },
    { nama_materi: 'Tajwid', skt: 2 },
];

// Data Lencana
export const LENCANA_DATA = [
    {
        nama_lencana: 'Bintang Emas',
        pencapaian: 'Nilai Sempurna',
        nilai_min: 95,
        icon_url: '⭐',
    },
    {
        nama_lencana: 'Bintang Perak',
        pencapaian: 'Nilai Sangat Baik',
        nilai_min: 85,
        icon_url: '🥈',
    },
    {
        nama_lencana: 'Bintang Perunggu',
        pencapaian: 'Nilai Baik',
        nilai_min: 70,
        icon_url: '🥉',
    },
];

// Data Kelompok (dengan kode untuk no_induk)
export const KELOMPOK_DATA = [
    { kode: '50', nama_kelompok: 'Kelompok A' },
    { kode: '51', nama_kelompok: 'Kelompok B' },
    { kode: '52', nama_kelompok: 'Kelompok C' },
    { kode: '53', nama_kelompok: 'Kelompok D' },
];

// Data User Admin Default
export const ADMIN_DEFAULT = {
    code: 'admin',
    role: 'admin',
    nama: 'Administrator',
    password: 'admin123', // Plain text, akan di-hash
};

// Helper function untuk hash password
export function hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
}
