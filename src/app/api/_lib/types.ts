export interface User {
    id: string;
    code: string; // no_induk untuk siswa, username untuk admin
    role: 'admin' | 'siswa';
    nama: string;
    siswa_id?: string; // reference ke master_siswa jika role=siswa
    created_at: string;
}

export interface LoginRequest {
    code: string; // no_induk atau username admin
    password: string;
}

export interface LoginResponse {
    success: boolean;
    token?: string;
    user?: {
        id: string;
        code: string;
        role: string;
        nama: string;
        siswa_id?: string;
    };
    message?: string;
}
