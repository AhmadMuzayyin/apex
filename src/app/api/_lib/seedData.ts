import * as bcrypt from 'bcryptjs';

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

// Data Tahap
export const TAHAP_DATA = [
    { nama_tahap: 'Tahap 1', urutan: 1 },
    { nama_tahap: 'Tahap 2', urutan: 2 },
    { nama_tahap: 'Tahap 3', urutan: 3 },
    { nama_tahap: 'Tahap 4', urutan: 4 },
];

// Data Materi
export const MATERI_DATA = [
    { nama_materi: 'Membaca', skt: 2 },
    { nama_materi: 'Menulis', skt: 2 },
    { nama_materi: 'Berhitung', skt: 2 },
    { nama_materi: 'Hafalan', skt: 2 },
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

// Data Kelompok
export const KELOMPOK_DATA = [
    { nama_kelompok: 'Kelompok A' },
    { nama_kelompok: 'Kelompok B' },
    { nama_kelompok: 'Kelompok C' },
];

// Data User Admin Default
export const ADMIN_DEFAULT = {
    code: 'admin',
    role: 'admin',
    nama: 'Administrator',
    password: 'admin123', // Plain text, akan di-hash
};

// Data Siswa Contoh (untuk testing)
export const SISWA_CONTOH = [
    {
        no_induk: '2024001',
        nama_lengkap: 'Ahmad Fauzi',
        kelompok_index: 0, // Akan di-resolve ke kelompok_id
        angkatan: 2024,
        password: 'siswa123',
    },
    {
        no_induk: '2024002',
        nama_lengkap: 'Siti Aminah',
        kelompok_index: 0,
        angkatan: 2024,
        password: 'siswa123',
    },
    {
        no_induk: '2024003',
        nama_lengkap: 'Budi Santoso',
        kelompok_index: 1,
        angkatan: 2024,
        password: 'siswa123',
    },
];

// Helper function untuk hash password
export function hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
}
