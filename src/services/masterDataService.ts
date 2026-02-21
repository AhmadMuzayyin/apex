import { firestoreService } from './firestoreService';
import type { Tahap, Materi, Kelompok, Siswa, Lencana, Bobot, Jadwal, Libur, Absensi, NilaiHarian, NilaiUlangan, JamTambahan } from '@/types/firestore';

export class MasterDataService {
    private cache = new Map<string, { expires: number; data: unknown }>();
    private pending = new Map<string, Promise<unknown>>();
    private readonly defaultTtlMs = 15000;

    private async withCache<T>(key: string, fetcher: () => Promise<T>, ttlMs = this.defaultTtlMs): Promise<T> {
        const cached = this.cache.get(key);
        if (cached && cached.expires > Date.now()) {
            return cached.data as T;
        }

        const pendingRequest = this.pending.get(key);
        if (pendingRequest) {
            return pendingRequest as Promise<T>;
        }

        const request = fetcher()
            .then((data) => {
                this.cache.set(key, { expires: Date.now() + ttlMs, data });
                this.pending.delete(key);
                return data;
            })
            .catch((error) => {
                this.pending.delete(key);
                throw error;
            });

        this.pending.set(key, request as Promise<unknown>);
        return request;
    }

    private invalidateAllCache() {
        this.cache.clear();
        this.pending.clear();
    }

    // ============================================
    // TAHAP
    // ============================================
    async getAllTahap() {
        return this.withCache('master_tahap:all', () => firestoreService.getAll<Tahap>('master_tahap', {
            orderByField: 'urutan',
            orderDirection: 'asc'
        }));
    }

    async getTahapById(id: string) {
        return firestoreService.getById<Tahap>('master_tahap', id);
    }

    async createTahap(data: Omit<Tahap, 'id'>) {
        const result = await firestoreService.create<Tahap>('master_tahap', data);
        this.invalidateAllCache();
        return result;
    }

    async updateTahap(id: string, data: Partial<Omit<Tahap, 'id'>>) {
        const result = await firestoreService.update<Tahap>('master_tahap', id, data);
        this.invalidateAllCache();
        return result;
    }

    async deleteTahap(id: string) {
        const result = await firestoreService.delete('master_tahap', id);
        this.invalidateAllCache();
        return result;
    }

    // ============================================
    // MATERI
    // ============================================
    async getAllMateri() {
        return this.withCache('master_materi:all', () => firestoreService.getAll<Materi>('master_materi', {
            orderByField: 'created_at',
            orderDirection: 'desc'
        }));
    }

    async getMateriById(id: string) {
        return firestoreService.getById<Materi>('master_materi', id);
    }

    async createMateri(data: Omit<Materi, 'id'>) {
        const result = await firestoreService.create<Materi>('master_materi', data);
        this.invalidateAllCache();
        return result;
    }

    async updateMateri(id: string, data: Partial<Omit<Materi, 'id'>>) {
        const result = await firestoreService.update<Materi>('master_materi', id, data);
        this.invalidateAllCache();
        return result;
    }

    async deleteMateri(id: string) {
        const result = await firestoreService.delete('master_materi', id);
        this.invalidateAllCache();
        return result;
    }

    // ============================================
    // KELOMPOK
    // ============================================
    async getAllKelompok() {
        return this.withCache('master_kelompok:all', () => firestoreService.getAll<Kelompok>('master_kelompok', {
            orderByField: 'created_at',
            orderDirection: 'desc'
        }));
    }

    async getKelompokById(id: string) {
        return firestoreService.getById<Kelompok>('master_kelompok', id);
    }

    async createKelompok(data: Omit<Kelompok, 'id'>) {
        const result = await firestoreService.create<Kelompok>('master_kelompok', data);
        this.invalidateAllCache();
        return result;
    }

    async updateKelompok(id: string, data: Partial<Omit<Kelompok, 'id'>>) {
        const result = await firestoreService.update<Kelompok>('master_kelompok', id, data);
        this.invalidateAllCache();
        return result;
    }

    async deleteKelompok(id: string) {
        const result = await firestoreService.delete('master_kelompok', id);
        this.invalidateAllCache();
        return result;
    }

    // ============================================
    // SISWA
    // ============================================
    async getAllSiswa() {
        return this.withCache('master_siswa:all', () => firestoreService.getAll<Siswa>('master_siswa', {
            orderByField: 'created_at',
            orderDirection: 'desc'
        }));
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
        const result = await firestoreService.create<Siswa>('master_siswa', data);
        this.invalidateAllCache();
        return result;
    }

    async updateSiswa(id: string, data: Partial<Omit<Siswa, 'id'>>) {
        const result = await firestoreService.update<Siswa>('master_siswa', id, data);
        this.invalidateAllCache();
        return result;
    }

    async deleteSiswa(id: string) {
        const result = await firestoreService.delete('master_siswa', id);
        this.invalidateAllCache();
        return result;
    }

    // ============================================
    // LENCANA
    // ============================================
    async getAllLencana() {
        return this.withCache('master_lencana:all', () => firestoreService.getAll<Lencana>('master_lencana', {
            orderByField: 'created_at',
            orderDirection: 'desc'
        }));
    }

    async getLencanaById(id: string) {
        return firestoreService.getById<Lencana>('master_lencana', id);
    }

    async createLencana(data: Omit<Lencana, 'id'>) {
        const result = await firestoreService.create<Lencana>('master_lencana', data);
        this.invalidateAllCache();
        return result;
    }

    async updateLencana(id: string, data: Partial<Omit<Lencana, 'id'>>) {
        const result = await firestoreService.update<Lencana>('master_lencana', id, data);
        this.invalidateAllCache();
        return result;
    }

    async deleteLencana(id: string) {
        const result = await firestoreService.delete('master_lencana', id);
        this.invalidateAllCache();
        return result;
    }

    // ============================================
    // BOBOT (Read Only)
    // ============================================
    async getAllBobot() {
        return this.withCache('master_bobot:all', () => firestoreService.getAll<Bobot>('master_bobot', {
            orderByField: 'bobot',
            orderDirection: 'desc'
        }));
    }

    // ============================================
    // LIBUR
    // ============================================
    async getAllLibur() {
        return this.withCache('master_libur:all', () => firestoreService.getAll<Libur>('master_libur', {
            orderByField: 'created_at',
            orderDirection: 'desc'
        }));
    }

    async getLiburById(id: string) {
        return firestoreService.getById<Libur>('master_libur', id);
    }

    async createLibur(data: Omit<Libur, 'id'>) {
        const result = await firestoreService.create<Libur>('master_libur', data);
        this.invalidateAllCache();
        return result;
    }

    async updateLibur(id: string, data: Partial<Omit<Libur, 'id'>>) {
        const result = await firestoreService.update<Libur>('master_libur', id, data);
        this.invalidateAllCache();
        return result;
    }

    async deleteLibur(id: string) {
        const result = await firestoreService.delete('master_libur', id);
        this.invalidateAllCache();
        return result;
    }

    // ============================================
    // JADWAL
    // ============================================
    async getAllJadwal() {
        return this.withCache('master_jadwal:all', () => firestoreService.getAll<Jadwal>('master_jadwal', {
            orderByField: 'created_at',
            orderDirection: 'desc'
        }));
    }

    async getJadwalById(id: string) {
        return firestoreService.getById<Jadwal>('master_jadwal', id);
    }

    async getJadwalByTanggal(tanggal: string) {
        return this.withCache(`master_jadwal:tanggal:${tanggal}`, () => firestoreService.queryDocs<Jadwal>('master_jadwal', [
            { field: 'tanggal', operator: '==', value: tanggal }
        ]));
    }

    async getJadwalByTahap(tahapId: string) {
        return this.withCache(`master_jadwal:tahap:${tahapId}`, () => firestoreService.queryDocs<Jadwal>('master_jadwal', [
            { field: 'tahap_id', operator: '==', value: tahapId }
        ]));
    }

    async createJadwal(data: Omit<Jadwal, 'id'>) {
        const result = await firestoreService.create<Jadwal>('master_jadwal', data);
        this.invalidateAllCache();
        return result;
    }

    async updateJadwal(id: string, data: Partial<Omit<Jadwal, 'id'>>) {
        const result = await firestoreService.update<Jadwal>('master_jadwal', id, data);
        this.invalidateAllCache();
        return result;
    }

    async deleteJadwal(id: string) {
        const result = await firestoreService.delete('master_jadwal', id);
        this.invalidateAllCache();
        return result;
    }

    // ============================================
    // ABSENSI
    // ============================================
    async getAllAbsensi() {
        return this.withCache('absensi:all', () => firestoreService.getAll<Absensi>('absensi', {
            orderByField: 'tanggal',
            orderDirection: 'desc'
        }));
    }

    async getAbsensiById(id: string) {
        return firestoreService.getById<Absensi>('absensi', id);
    }

    async getAbsensiByJadwal(jadwalId: string) {
        return this.withCache(`absensi:jadwal:${jadwalId}`, () => firestoreService.queryDocs<Absensi>('absensi', [
            { field: 'jadwal_id', operator: '==', value: jadwalId }
        ]));
    }

    async getAbsensiByTanggal(tanggal: string) {
        return this.withCache(`absensi:tanggal:${tanggal}`, () => firestoreService.queryDocs<Absensi>('absensi', [
            { field: 'tanggal', operator: '==', value: tanggal }
        ]));
    }

    async getAbsensiByJadwalAndSiswa(jadwalId: string, siswaId: string) {
        const results = await firestoreService.queryDocs<Absensi>('absensi', [
            { field: 'jadwal_id', operator: '==', value: jadwalId },
            { field: 'siswa_id', operator: '==', value: siswaId }
        ]);
        return results[0] || null;
    }

    async createAbsensi(data: Omit<Absensi, 'id'>) {
        const result = await firestoreService.create<Absensi>('absensi', data);
        this.invalidateAllCache();
        return result;
    }

    async updateAbsensi(id: string, data: Partial<Omit<Absensi, 'id'>>) {
        const result = await firestoreService.update<Absensi>('absensi', id, data);
        this.invalidateAllCache();
        return result;
    }

    async deleteAbsensi(id: string) {
        const result = await firestoreService.delete('absensi', id);
        this.invalidateAllCache();
        return result;
    }

    // ============================================
    // NILAI HARIAN
    // ============================================
    async getAllNilaiHarian() {
        return this.withCache('nilai_harian:all', () => firestoreService.getAll<NilaiHarian>('nilai_harian', {
            orderByField: 'tanggal_input',
            orderDirection: 'desc'
        }));
    }

    async getNilaiHarianByJadwal(jadwalId: string) {
        return this.withCache(`nilai_harian:jadwal:${jadwalId}`, () => firestoreService.queryDocs<NilaiHarian>('nilai_harian', [
            { field: 'jadwal_id', operator: '==', value: jadwalId }
        ]));
    }

    async getNilaiHarianByTahap(tahapId: string) {
        return this.withCache(`nilai_harian:tahap:${tahapId}`, () => firestoreService.queryDocs<NilaiHarian>('nilai_harian', [
            { field: 'tahap_id', operator: '==', value: tahapId }
        ]));
    }

    async getNilaiHarianBySiswaMateri(siswaId: string, materiId: string) {
        return this.withCache(`nilai_harian:siswa:${siswaId}:materi:${materiId}`, () => firestoreService.queryDocs<NilaiHarian>('nilai_harian', [
            { field: 'siswa_id', operator: '==', value: siswaId },
            { field: 'materi_id', operator: '==', value: materiId }
        ]));
    }

    async createNilaiHarian(data: Omit<NilaiHarian, 'id'>) {
        const result = await firestoreService.create<NilaiHarian>('nilai_harian', data);
        this.invalidateAllCache();
        return result;
    }

    async updateNilaiHarian(id: string, data: Partial<Omit<NilaiHarian, 'id'>>) {
        const result = await firestoreService.update<NilaiHarian>('nilai_harian', id, data);
        this.invalidateAllCache();
        return result;
    }

    async deleteNilaiHarian(id: string) {
        const result = await firestoreService.delete('nilai_harian', id);
        this.invalidateAllCache();
        return result;
    }

    // ============================================
    // NILAI ULANGAN
    // ============================================
    async getAllNilaiUlangan() {
        return this.withCache('nilai_ulangan:all', () => firestoreService.getAll<NilaiUlangan>('nilai_ulangan', {
            orderByField: 'tanggal_input',
            orderDirection: 'desc'
        }));
    }

    async getNilaiUlanganByTahap(tahapId: string) {
        return this.withCache(`nilai_ulangan:tahap:${tahapId}`, () => firestoreService.queryDocs<NilaiUlangan>('nilai_ulangan', [
            { field: 'tahap_id', operator: '==', value: tahapId }
        ]));
    }

    async getNilaiUlanganByTahapMateriKelompok(tahapId: string, materiId: string, kelompokId: string) {
        return this.withCache(`nilai_ulangan:tahap:${tahapId}:materi:${materiId}:kelompok:${kelompokId}`, () => firestoreService.queryDocs<NilaiUlangan>('nilai_ulangan', [
            { field: 'tahap_id', operator: '==', value: tahapId },
            { field: 'materi_id', operator: '==', value: materiId },
            { field: 'kelompok_id', operator: '==', value: kelompokId }
        ]));
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
        const result = await firestoreService.create<NilaiUlangan>('nilai_ulangan', data);
        this.invalidateAllCache();
        return result;
    }

    async updateNilaiUlangan(id: string, data: Partial<Omit<NilaiUlangan, 'id'>>) {
        const result = await firestoreService.update<NilaiUlangan>('nilai_ulangan', id, data);
        this.invalidateAllCache();
        return result;
    }

    async deleteNilaiUlangan(id: string) {
        const result = await firestoreService.delete('nilai_ulangan', id);
        this.invalidateAllCache();
        return result;
    }

    // ============================================
    // JAM TAMBAHAN
    // ============================================
    async getAllJamTambahan() {
        return this.withCache('jam_tambahan:all', () => firestoreService.getAll<JamTambahan>('jam_tambahan', {
            orderByField: 'created_at',
            orderDirection: 'desc'
        }));
    }

    async getJamTambahanBySiswa(siswaId: string) {
        return this.withCache(`jam_tambahan:siswa:${siswaId}`, () => firestoreService.queryDocs<JamTambahan>('jam_tambahan', [
            { field: 'siswa_id', operator: '==', value: siswaId }
        ]));
    }

    async createJamTambahan(data: Omit<JamTambahan, 'id'>) {
        const result = await firestoreService.create<JamTambahan>('jam_tambahan', data);
        this.invalidateAllCache();
        return result;
    }

    async updateJamTambahan(id: string, data: Partial<Omit<JamTambahan, 'id'>>) {
        const result = await firestoreService.update<JamTambahan>('jam_tambahan', id, data);
        this.invalidateAllCache();
        return result;
    }

    async deleteJamTambahan(id: string) {
        const result = await firestoreService.delete('jam_tambahan', id);
        this.invalidateAllCache();
        return result;
    }
}

export const masterDataService = new MasterDataService();
