import { signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface AuthUser {
    id: string;
    code: string;
    role: 'admin' | 'siswa';
    nama: string;
    siswa_id?: string;
}

class AuthService {
    async login(code: string, password: string): Promise<AuthUser> {
        try {
            // Call Vercel API endpoint
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
            const response = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code, password }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Login gagal');
            }

            // Sign in dengan custom token
            await signInWithCustomToken(auth, data.token);

            // Return user data
            return data.user;
        } catch (error: any) {
            throw new Error(error.message || 'Terjadi kesalahan saat login');
        }
    }

    async logout(): Promise<void> {
        await firebaseSignOut(auth);
    }

    getCurrentUser() {
        return auth.currentUser;
    }
}

export const authService = new AuthService();
