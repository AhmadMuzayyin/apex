import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../_lib/firebaseAdmin';

/**
 * PUT /api/tahun-akademik/[id]
 * Update tahun akademik
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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
                if (doc.id !== id) {
                    batch.update(doc.ref, { 
                        status: 'selesai', 
                        updated_at: new Date().toISOString() 
                    });
                }
            });
            await batch.commit();
        }

        // Update tahun akademik
        const docRef = adminDb.collection('tahun_akademik').doc(id);
        await docRef.update({
            tahun,
            tanggal_mulai,
            tanggal_selesai,
            status,
            updated_at: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: 'Tahun akademik berhasil diupdate',
        });
    } catch (error) {
        console.error('Update tahun akademik error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat mengupdate data',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

/**
 * DELETE /api/tahun-akademik/[id]
 * Delete tahun akademik
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if there are enrollments for this tahun akademik
        const enrollmentsSnapshot = await adminDb
            .collection('siswa_enrollment')
            .where('tahun_akademik_id', '==', id)
            .limit(1)
            .get();

        if (!enrollmentsSnapshot.empty) {
            return NextResponse.json({
                success: false,
                message: 'Tidak dapat menghapus tahun akademik yang sudah memiliki siswa terdaftar',
            }, { status: 400 });
        }

        // Check if there are tahap for this tahun akademik
        const tahapSnapshot = await adminDb
            .collection('tahap')
            .where('tahun_akademik_id', '==', id)
            .limit(1)
            .get();

        if (!tahapSnapshot.empty) {
            return NextResponse.json({
                success: false,
                message: 'Tidak dapat menghapus tahun akademik yang sudah memiliki tahapan',
            }, { status: 400 });
        }

        // Delete tahun akademik
        await adminDb.collection('tahun_akademik').doc(id).delete();

        return NextResponse.json({
            success: true,
            message: 'Tahun akademik berhasil dihapus',
        });
    } catch (error) {
        console.error('Delete tahun akademik error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat menghapus data',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
