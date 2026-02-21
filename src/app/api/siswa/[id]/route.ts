import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../_lib/firebaseAdmin';

type EnrollmentDoc = {
    id: string;
    status?: string;
    kelompok_id?: string;
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: siswaId } = await params;
        const { searchParams } = new URL(request.url);
        const tahunAkademikId = searchParams.get('tahun_akademik_id');

        if (!siswaId) {
            return NextResponse.json({
                success: false,
                message: 'ID siswa tidak valid',
            }, { status: 400 });
        }

        const siswaSnap = await adminDb.collection('master_siswa').doc(siswaId).get();
        if (!siswaSnap.exists) {
            return NextResponse.json({
                success: false,
                message: 'Siswa tidak ditemukan',
            }, { status: 404 });
        }

        let enrollmentQuery = adminDb.collection('siswa_enrollment').where('siswa_id', '==', siswaId);
        if (tahunAkademikId) {
            enrollmentQuery = enrollmentQuery.where('tahun_akademik_id', '==', tahunAkademikId);
        }
        const enrollmentSnapshot = await enrollmentQuery.get();
        const enrollmentDocs: EnrollmentDoc[] = enrollmentSnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<EnrollmentDoc, 'id'>),
        }));
        const enrollmentActive = enrollmentDocs.find(e => e.status === 'aktif');
        const enrollment = enrollmentActive || enrollmentDocs[0] || null;

        let kelompok = null;
        if (enrollment?.kelompok_id) {
            const kelompokSnap = await adminDb.collection('master_kelompok').doc(enrollment.kelompok_id).get();
            if (kelompokSnap.exists) {
                kelompok = { id: kelompokSnap.id, ...kelompokSnap.data() };
            }
        }

        let tahapQuery: FirebaseFirestore.Query = adminDb.collection('master_tahap');
        if (tahunAkademikId) {
            tahapQuery = tahapQuery.where('tahun_akademik_id', '==', tahunAkademikId);
        }

        const [tahapSnapshot, materiSnapshot, lencanaSnapshot] = await Promise.all([
            tahapQuery.get(),
            adminDb.collection('master_materi').get(),
            adminDb.collection('master_lencana').get(),
        ]);

        let jadwalSnapshot = null;
        if (tahunAkademikId && enrollment?.kelompok_id) {
            jadwalSnapshot = await adminDb
                .collection('master_jadwal')
                .where('tahun_akademik_id', '==', tahunAkademikId)
                .where('kelompok_id', '==', enrollment.kelompok_id)
                .get();
        }

        let nilaiHarianQuery = adminDb.collection('nilai_harian').where('siswa_id', '==', siswaId);
        let nilaiUlanganQuery = adminDb.collection('nilai_ulangan').where('siswa_id', '==', siswaId);
        let jamTambahanQuery = adminDb.collection('jam_tambahan').where('siswa_id', '==', siswaId);

        if (tahunAkademikId) {
            nilaiHarianQuery = nilaiHarianQuery.where('tahun_akademik_id', '==', tahunAkademikId);
            nilaiUlanganQuery = nilaiUlanganQuery.where('tahun_akademik_id', '==', tahunAkademikId);
            jamTambahanQuery = jamTambahanQuery.where('tahun_akademik_id', '==', tahunAkademikId);
        }

        const [nilaiHarianSnapshot, nilaiUlanganSnapshot, jamTambahanSnapshot] = await Promise.all([
            nilaiHarianQuery.get(),
            nilaiUlanganQuery.get(),
            jamTambahanQuery.get(),
        ]);

        const siswa = { id: siswaSnap.id, ...siswaSnap.data() };
        const tahaps = tahapSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const materis = materiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lencanas = lencanaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const nilaiHarian = nilaiHarianSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const nilaiUlangan = nilaiUlanganSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const jamTambahan = jamTambahanSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const jadwals = jadwalSnapshot ? jadwalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) : [];

        return NextResponse.json({
            success: true,
            data: {
                siswa,
                enrollment,
                kelompok,
                tahaps,
                materis,
                lencanas,
                nilai_harian: nilaiHarian,
                nilai_ulangan: nilaiUlangan,
                jam_tambahan: jamTambahan,
                jadwals,
            }
        });
    } catch (error) {
        console.error('Get siswa data error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat memuat data siswa',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: siswaId } = await params;
        const body = await request.json();

        if (!siswaId) {
            return NextResponse.json({
                success: false,
                message: 'ID siswa tidak valid',
            }, { status: 400 });
        }

        // Update siswa data
        await adminDb.collection('master_siswa').doc(siswaId).update({
            ...body,
            updated_at: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: 'Data siswa berhasil diupdate',
        });
    } catch (error) {
        console.error('Update siswa error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat mengupdate data',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

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
        
        // 1. Delete all enrollments
        const enrollmentSnapshot = await adminDb.collection('siswa_enrollment')
            .where('siswa_id', '==', siswaId)
            .get();
        enrollmentSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // 2. Delete user account
        const usersSnapshot = await adminDb.collection('users')
            .where('siswa_id', '==', siswaId)
            .get();
        usersSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // 3. Delete all nilai harian
        const nilaiHarianSnapshot = await adminDb.collection('nilai_harian')
            .where('siswa_id', '==', siswaId)
            .get();
        nilaiHarianSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // 4. Delete all nilai ulangan
        const nilaiUlanganSnapshot = await adminDb.collection('nilai_ulangan')
            .where('siswa_id', '==', siswaId)
            .get();
        nilaiUlanganSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // 5. Delete all absensi
        const absensiSnapshot = await adminDb.collection('absensi')
            .where('siswa_id', '==', siswaId)
            .get();
        absensiSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // 6. Delete all jam tambahan
        const jamTambahanSnapshot = await adminDb.collection('jam_tambahan')
            .where('siswa_id', '==', siswaId)
            .get();
        jamTambahanSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // 7. Delete all prestasi
        const prestasiSnapshot = await adminDb.collection('prestasi')
            .where('siswa_id', '==', siswaId)
            .get();
        prestasiSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // 8. Finally, delete siswa master data
        const siswaRef = adminDb.collection('master_siswa').doc(siswaId);
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
