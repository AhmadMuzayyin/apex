import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../_lib/firebaseAdmin';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: siswaId } = await params;

        if (!siswaId) {
            return NextResponse.json({
                success: false,
                message: 'ID siswa tidak valid',
            }, { status: 400 });
        }

        // CASCADE DELETE - Delete all related data
        const batch = adminDb.batch();
        
        // 1. Delete user account
        const usersSnapshot = await adminDb.collection('users')
            .where('siswa_id', '==', siswaId)
            .get();
        usersSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // 2. Delete all nilai harian
        const nilaiHarianSnapshot = await adminDb.collection('nilai_harian')
            .where('siswa_id', '==', siswaId)
            .get();
        nilaiHarianSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // 3. Delete all nilai ulangan
        const nilaiUlanganSnapshot = await adminDb.collection('nilai_ulangan')
            .where('siswa_id', '==', siswaId)
            .get();
        nilaiUlanganSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // 4. Delete all absensi
        const absensiSnapshot = await adminDb.collection('absensi')
            .where('siswa_id', '==', siswaId)
            .get();
        absensiSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // 5. Delete all jam tambahan
        const jamTambahanSnapshot = await adminDb.collection('jam_tambahan')
            .where('siswa_id', '==', siswaId)
            .get();
        jamTambahanSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // 6. Delete all prestasi
        const prestasiSnapshot = await adminDb.collection('prestasi')
            .where('siswa_id', '==', siswaId)
            .get();
        prestasiSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // 7. Finally, delete siswa
        const siswaRef = adminDb.collection('siswa').doc(siswaId);
        batch.delete(siswaRef);
        
        // Commit all deletes
        await batch.commit();

        return NextResponse.json({
            success: true,
            message: 'Siswa dan semua data terkait berhasil dihapus',
        });
    } catch (error) {
        console.error('Delete siswa error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat menghapus data',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
