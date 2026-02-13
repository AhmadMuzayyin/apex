import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../_lib/firebaseAdmin';
import {
    TAHUN_AKADEMIK_DATA,
    BOBOT_DATA,
    TAHAP_DATA,
    MATERI_DATA,
    LENCANA_DATA,
    KELOMPOK_DATA,
    ADMIN_DEFAULT,
    hashPassword,
} from '../_lib/seedData';

export async function POST(request: NextRequest) {
    try {
        const results: any = {
            tahun_akademik: [],
            bobot: [],
            tahap: [],
            materi: [],
            lencana: [],
            kelompok: [],
            admin: null,
        };

        // 1. Seed Tahun Akademik
        console.log('Seeding Tahun Akademik...');
        for (const ta of TAHUN_AKADEMIK_DATA) {
            const docRef = await adminDb.collection('tahun_akademik').add({
                ...ta,
                created_at: new Date().toISOString(),
            });
            results.tahun_akademik.push({ id: docRef.id, ...ta });
        }

        // Get active tahun akademik for tahap seeding
        const activeTahunAkademik = results.tahun_akademik.find((ta: any) => ta.status === 'aktif');
        if (!activeTahunAkademik) {
            throw new Error('No active tahun akademik found');
        }

        // 2. Seed Bobot
        console.log('Seeding Bobot...');
        for (const bobot of BOBOT_DATA) {
            const docRef = await adminDb.collection('bobot').add(bobot);
            results.bobot.push({ id: docRef.id, ...bobot });
        }

        // 3. Seed Kelompok
        console.log('Seeding Kelompok...');
        for (const kelompok of KELOMPOK_DATA) {
            const docRef = await adminDb.collection('kelompok').add({
                ...kelompok,
                created_at: new Date().toISOString(),
            });
            results.kelompok.push({ id: docRef.id, ...kelompok });
        }

        // 4. Seed Materi
        console.log('Seeding Materi...');
        for (const materi of MATERI_DATA) {
            const docRef = await adminDb.collection('materi').add({
                ...materi,
                created_at: new Date().toISOString(),
            });
            results.materi.push({ id: docRef.id, ...materi });
        }

        // 5. Seed Tahap (linked to active tahun akademik)
        console.log('Seeding Tahap...');
        for (const tahap of TAHAP_DATA) {
            const docRef = await adminDb.collection('tahap').add({
                ...tahap,
                tahun_akademik_id: activeTahunAkademik.id,
                created_at: new Date().toISOString(),
            });
            results.tahap.push({ id: docRef.id, ...tahap });
        }

        // 6. Seed Lencana
        console.log('Seeding Lencana...');
        for (const lencana of LENCANA_DATA) {
            const docRef = await adminDb.collection('lencana').add({
                ...lencana,
                created_at: new Date().toISOString(),
            });
            results.lencana.push({ id: docRef.id, ...lencana });
        }

        // 7. Seed Admin User
        console.log('Seeding Admin User...');
        const adminPasswordHash = hashPassword(ADMIN_DEFAULT.password);
        const adminDocRef = await adminDb.collection('users').add({
            code: ADMIN_DEFAULT.code,
            role: ADMIN_DEFAULT.role,
            nama: ADMIN_DEFAULT.nama,
            password_hash: adminPasswordHash,
            created_at: new Date().toISOString(),
        });
        results.admin = { id: adminDocRef.id, ...ADMIN_DEFAULT };

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully',
            results,
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to seed database',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
