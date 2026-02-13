import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../_lib/firebaseAdmin';

/**
 * GET /api/tahun-akademik
 * Get all tahun akademik or active one
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') === 'true';

        let query = adminDb.collection('tahun_akademik');
        
        if (activeOnly) {
            const snapshot = await query.where('status', '==', 'aktif').limit(1).get();
            
            if (snapshot.empty) {
                return NextResponse.json({
                    success: false,
                    message: 'Tidak ada tahun akademik aktif',
                }, { status: 404 });
            }

            const doc = snapshot.docs[0];
            return NextResponse.json({
                success: true,
                data: { id: doc.id, ...doc.data() },
            });
        }

        // Get all
        const snapshot = await query.orderBy('created_at', 'desc').get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Get tahun akademik error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

/**
 * POST /api/tahun-akademik
 * Create new tahun akademik
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tahun, tanggal_mulai, tanggal_selesai, status } = body;

        if (!tahun || !tanggal_mulai || !tanggal_selesai || !status) {
            return NextResponse.json({
                success: false,
                message: 'Semua field harus diisi',
            }, { status: 400 });
        }

        // If status is 'aktif', deactivate other active tahun akademik
        if (status === 'aktif') {
            const activeSnapshot = await adminDb
                .collection('tahun_akademik')
                .where('status', '==', 'aktif')
                .get();

            const batch = adminDb.batch();
            activeSnapshot.docs.forEach(doc => {
                batch.update(doc.ref, { status: 'selesai', updated_at: new Date().toISOString() });
            });
            await batch.commit();
        }

        const docRef = await adminDb.collection('tahun_akademik').add({
            tahun,
            tanggal_mulai,
            tanggal_selesai,
            status,
            created_at: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: 'Tahun akademik berhasil dibuat',
            data: { id: docRef.id },
        });
    } catch (error) {
        console.error('Create tahun akademik error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat membuat data',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
