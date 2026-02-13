import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../_lib/firebaseAdmin';
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        // Get all users with role siswa
        const usersRef = adminDb.collection('users');
        const snapshot = await usersRef.where('role', '==', 'siswa').get();

        if (snapshot.empty) {
            return NextResponse.json({
                success: true,
                message: 'Tidak ada user siswa yang perlu dimigrasi',
                updated: 0,
            });
        }

        const defaultPassword = 'password';
        const newPasswordHash = await bcrypt.hash(defaultPassword, 10);
        
        let updated = 0;
        const batch = adminDb.batch();

        snapshot.docs.forEach((doc) => {
            const userData = doc.data();
            // Check if password_hash looks like base64 (not bcrypt)
            // Bcrypt hash starts with $2a$, $2b$, or $2y$
            if (!userData.password_hash.startsWith('$2')) {
                batch.update(doc.ref, {
                    password_hash: newPasswordHash,
                    updated_at: new Date().toISOString(),
                });
                updated++;
            }
        });

        if (updated > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            message: `Berhasil memigrasikan ${updated} password siswa`,
            updated,
            total: snapshot.docs.length,
        });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat migrasi password',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
