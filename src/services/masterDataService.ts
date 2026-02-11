import { firestoreService } from './firestoreService';
import type { Tahap, Materi, Kelompok, Siswa, Lencana, Bobot, Jadwal, Libur, Absensi, NilaiHarian, NilaiUlangan, JamTambahan } from '@/types/firestore';

export class MasterDataService {
    // ============================================
    // TAHAP
    // ============================================
    async getAllTahap() {
        return firestoreService.getAll<Tahap>('master_tahap', {
            orderByField: 'urutan',
            orderDirection: 'asc'
        });
    }

    async getTahapById(id: string) {
        return firestoreService.getById<Tahap>('master_tahap', id);
    }

    async createTahap(data: Omit<Tahap, 'id'>) {
        return firestoreService.create<Tahap>('master_tahap', data);
    }

    async updateTahap(id: string, data: Partial<Omit<Tahap, 'id'>>) {
        return firestoreService.update<Tahap>('master_tahap', id, data);
    }

    async deleteTahap(id: string) {
        return firestoreService.delete('master_tahap', id);
    }

    // ============================================
    // MATERI
    // ============================================
    async getAllMateri() {
        return firestoreService.getAll<Materi>('master_materi', {
            orderByField: 'nama_materi',
            orderDirection: 'asc'
        });
    }

    async getMateriById(id: string) {
        return firestoreService.getById<Materi>('master_materi', id);
    }

    async createMateri(data: Omit<Materi, 'id'>) {
        return firestoreService.create<Materi>('master_materi', data);
    }

    async updateMateri(id: string, data: Partial<Omit<Materi, 'id'>>) {
        return firestoreService.update<Materi>('master_materi', id, data);
    }

    async deleteMateri(id: string) {
        return firestoreService.delete('master_materi', id);
    }

    // ============================================
    // KELOMPOK
    // ============================================
    async getAllKelompok() {
        return firestoreService.getAll<Kelompok>('master_kelompok', {
            orderByField: 'nama_kelompok',
            orderDirection: 'asc'
        });
    }

    async getKelompokById(id: string) {
        return firestoreService.getById<Kelompok>('master_kelompok', id);
    }

    async createKelompok(data: Omit<Kelompok, 'id'>) {
        return firestoreService.create<Kelompok>('master_kelompok', data);
    }

    async updateKelompok(id: string, data: Partial<Omit<Kelompok, 'id'>>) {
        return firestoreService.update<Kelompok>('master_kelompok', id, data);
    }

    async deleteKelompok(id: string) {
        return firestoreService.delete('master_kelompok', id);
    }

    // ============================================
    // SISWA
    // ============================================
    async getAllSiswa() {
        return firestoreService.getAll<Siswa>('master_siswa', {
            orderByField: 'nama_lengkap',
            orderDirection: 'asc'
        });
    }

    async getSiswaById(id: string) {
        return firestoreService.getById<Siswa>('master_siswa', id);
    }

    async getSiswaByKelompok(kelompokId: string) {
        return firestoreService.queryDocs<Siswa>('master_siswa', [
            { field: 'kelompok_id', operator: '==', value: kelompokId }
        ]);
    }

    async createSiswa(data: Omit<Siswa, 'id'>) {
        return firestoreService.create<Siswa>('master_siswa', data);
    }

    async updateSiswa(id: string, data: Partial<Omit<Siswa, 'id'>>) {
        return firestoreService.update<Siswa>('master_siswa', id, data);
    }

    async deleteSiswa(id: string) {
        return firestoreService.delete('master_siswa', id);
    }

    // ============================================
    // LENCANA
    // ============================================
    async getAllLencana() {
        return firestoreService.getAll<Lencana>('master_lencana', {
            orderByField: 'nilai_min',
            orderDirection: 'desc'
        });
    }

    async getLencanaById(id: string) {
        return firestoreService.getById<Lencana>('master_lencana', id);
    }

    async createLencana(data: Omit<Lencana, 'id'>) {
        return firestoreService.create<Lencana>('master_lencana', data);
    }

    async updateLencana(id: string, data: Partial<Omit<Lencana, 'id'>>) {
        return firestoreService.update<Lencana>('master_lencana', id, data);
    }

    async deleteLencana(id: string) {
        return firestoreService.delete('master_lencana', id);
    }

    // ============================================
    // BOBOT (Read Only)
    // ============================================
    async getAllBobot() {
        return firestoreService.getAll<Bobot>('master_bobot', {
            orderByField: 'bobot',
            orderDirection: 'desc'
        });
    }

    // ============================================
    // LIBUR
    // ============================================
    async getAllLibur() {
        return firestoreService.getAll<Libur>('master_libur', {
            orderByField: 'created_at',
            orderDirection: 'desc'
        });
    }

    async getLiburById(id: string) {
        return firestoreService.getById<Libur>('master_libur', id);
    }

    async createLibur(data: Omit<Libur, 'id'>) {
        return firestoreService.create<Libur>('master_libur', data);
    }

    async updateLibur(id: string, data: Partial<Omit<Libur, 'id'>>) {
        return firestoreService.update<Libur>('master_libur', id, data);
    }

    async deleteLibur(id: string) {
        return firestoreService.delete('master_libur', id);
    }

    // ============================================
    // JADWAL
    // ============================================
    async getAllJadwal() {
        return firestoreService.getAll<Jadwal>('master_jadwal', {
            orderByField: 'tanggal',
            orderDirection: 'desc'
        });
    }

    async getJadwalById(id: string) {
        return firestoreService.getById<Jadwal>('master_jadwal', id);
    }

    async getJadwalByTanggal(tanggal: string) {
        return firestoreService.queryDocs<Jadwal>('master_jadwal', [
            { field: 'tanggal', operator: '==', value: tanggal }
        ]);
    }

    async getJadwalByTahap(tahapId: string) {
        return firestoreService.queryDocs<Jadwal>('master_jadwal', [
            { field: 'tahap_id', operator: '==', value: tahapId }
        ]);
    }

    async createJadwal(data: Omit<Jadwal, 'id'>) {
        return firestoreService.create<Jadwal>('master_jadwal', data);
    }

    async updateJadwal(id: string, data: Partial<Omit<Jadwal, 'id'>>) {
        return firestoreService.update<Jadwal>('master_jadwal', id, data);
    }

    async deleteJadwal(id: string) {
        return firestoreService.delete('master_jadwal', id);
    }

    // ============================================
    // ABSENSI
    // ============================================
    async getAllAbsensi() {
        return firestoreService.getAll<Absensi>('absensi', {
            orderByField: 'tanggal',
            orderDirection: 'desc'
        });
    }

    async getAbsensiById(id: string) {
        return firestoreService.getById<Absensi>('absensi', id);
    }

    async getAbsensiByJadwal(jadwalId: string) {
        return firestoreService.queryDocs<Absensi>('absensi', [
            { field: 'jadwal_id', operator: '==', value: jadwalId }
        ]);
    }

    async getAbsensiByTanggal(tanggal: string) {
        return firestoreService.queryDocs<Absensi>('absensi', [
            { field: 'tanggal', operator: '==', value: tanggal }
        ]);
    }

    async getAbsensiByJadwalAndSiswa(jadwalId: string, siswaId: string) {
        const results = await firestoreService.queryDocs<Absensi>('absensi', [
            { field: 'jadwal_id', operator: '==', value: jadwalId },
            { field: 'siswa_id', operator: '==', value: siswaId }
        ]);
        return results[0] || null;
    }

    async createAbsensi(data: Omit<Absensi, 'id'>) {
        return firestoreService.create<Absensi>('absensi', data);
    }

    async updateAbsensi(id: string, data: Partial<Omit<Absensi, 'id'>>) {
        return firestoreService.update<Absensi>('absensi', id, data);
    }

    async deleteAbsensi(id: string) {
        return firestoreService.delete('absensi', id);
    }

    // ============================================
    // NILAI HARIAN
    // ============================================
    async getAllNilaiHarian() {
        return firestoreService.getAll<NilaiHarian>('nilai_harian', {
            orderByField: 'tanggal_input',
            orderDirection: 'desc'
        });
    }

    async getNilaiHarianByJadwal(jadwalId: string) {
        return firestoreService.queryDocs<NilaiHarian>('nilai_harian', [
            { field: 'jadwal_id', operator: '==', value: jadwalId }
        ]);
    }

    async getNilaiHarianByTahap(tahapId: string) {
        return firestoreService.queryDocs<NilaiHarian>('nilai_harian', [
            { field: 'tahap_id', operator: '==', value: tahapId }
        ]);
    }

    async getNilaiHarianBySiswaMateri(siswaId: string, materiId: string) {
        return firestoreService.queryDocs<NilaiHarian>('nilai_harian', [
            { field: 'siswa_id', operator: '==', value: siswaId },
            { field: 'materi_id', operator: '==', value: materiId }
        ]);
    }

    async createNilaiHarian(data: Omit<NilaiHarian, 'id'>) {
        return firestoreService.create<NilaiHarian>('nilai_harian', data);
    }

    async updateNilaiHarian(id: string, data: Partial<Omit<NilaiHarian, 'id'>>) {
        return firestoreService.update<NilaiHarian>('nilai_harian', id, data);
    }

    async deleteNilaiHarian(id: string) {
        return firestoreService.delete('nilai_harian', id);
    }

    // ============================================
    // NILAI ULANGAN
    // ============================================
    async getAllNilaiUlangan() {
        return firestoreService.getAll<NilaiUlangan>('nilai_ulangan', {
            orderByField: 'tanggal_input',
            orderDirection: 'desc'
        });
    }

    async getNilaiUlanganByTahap(tahapId: string) {
        return firestoreService.queryDocs<NilaiUlangan>('nilai_ulangan', [
            { field: 'tahap_id', operator: '==', value: tahapId }
        ]);
    }

    async getNilaiUlanganByTahapMateriKelompok(tahapId: string, materiId: string, kelompokId: string) {
        return firestoreService.queryDocs<NilaiUlangan>('nilai_ulangan', [
            { field: 'tahap_id', operator: '==', value: tahapId },
            { field: 'materi_id', operator: '==', value: materiId },
            { field: 'kelompok_id', operator: '==', value: kelompokId }
        ]);
    }

    async getNilaiUlanganBySiswa(siswaId: string, tahapId: string, materiId: string) {
        const results = await firestoreService.queryDocs<NilaiUlangan>('nilai_ulangan', [
            { field: 'siswa_id', operator: '==', value: siswaId },
            { field: 'tahap_id', operator: '==', value: tahapId },
            { field: 'materi_id', operator: '==', value: materiId }
        ]);
        return results[0] || null;
    }

    async createNilaiUlangan(data: Omit<NilaiUlangan, 'id'>) {
        return firestoreService.create<NilaiUlangan>('nilai_ulangan', data);
    }

    async updateNilaiUlangan(id: string, data: Partial<Omit<NilaiUlangan, 'id'>>) {
        return firestoreService.update<NilaiUlangan>('nilai_ulangan', id, data);
    }

    async deleteNilaiUlangan(id: string) {
        return firestoreService.delete('nilai_ulangan', id);
    }

    // ============================================
    // JAM TAMBAHAN
    // ============================================
    async getAllJamTambahan() {
        return firestoreService.getAll<JamTambahan>('jam_tambahan', {
            orderByField: 'created_at',
            orderDirection: 'desc'
        });
    }

    async getJamTambahanBySiswa(siswaId: string) {
        return firestoreService.queryDocs<JamTambahan>('jam_tambahan', [
            { field: 'siswa_id', operator: '==', value: siswaId }
        ]);
    }

    async createJamTambahan(data: Omit<JamTambahan, 'id'>) {
        return firestoreService.create<JamTambahan>('jam_tambahan', data);
    }

    async updateJamTambahan(id: string, data: Partial<Omit<JamTambahan, 'id'>>) {
        return firestoreService.update<JamTambahan>('jam_tambahan', id, data);
    }

    async deleteJamTambahan(id: string) {
        return firestoreService.delete('jam_tambahan', id);
    }
}

export const masterDataService = new MasterDataService();
