import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../_lib/firebaseAdmin';
import * as bcrypt from 'bcryptjs';

/**
 * Generate no_induk dengan format: YYYY[KK][NNNN]
 * YYYY = tahun angkatan (4 digit)
 * KK = kode kelompok (2 digit)
 * NNNN = nomor urut (4 digit, auto increment)
 */
async function generateNoInduk(tahun: number, kodeKelompok: string): Promise<string> {
    // Get all siswa dengan angkatan dan kode kelompok yang sama
    const prefix = `${tahun}${kodeKelompok}`;
    
    const siswaSnapshot = await adminDb
        .collection('master_siswa')
        .where('no_induk', '>=', prefix)
        .where('no_induk', '<', prefix + 'Z') // To limit range
        .get();

    // Find highest number
    let maxNumber = 0;
    siswaSnapshot.docs.forEach(doc => {
        const noInduk = doc.data().no_induk as string;
        if (noInduk.startsWith(prefix)) {
            const numberPart = parseInt(noInduk.substring(prefix.length));
            if (!isNaN(numberPart) && numberPart > maxNumber) {
                maxNumber = numberPart;
            }
        }
    });

    // Generate new number (increment by 1)
    const newNumber = (maxNumber + 1).toString().padStart(4, '0');
    return `${prefix}${newNumber}`;
}

/**
 * POST /api/enrollment
 * Create new siswa and enrollment
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nama_lengkap, kelompok_id, tahun_akademik_id } = body;

        // Validasi
        if (!nama_lengkap || !kelompok_id || !tahun_akademik_id) {
            return NextResponse.json({
                success: false,
                message: 'Semua field harus diisi',
            }, { status: 400 });
        }

        // Get kelompok data untuk ambil kode
        const kelompokDoc = await adminDb.collection('master_kelompok').doc(kelompok_id).get();
        if (!kelompokDoc.exists) {
            return NextResponse.json({
                success: false,
                message: 'Kelompok tidak ditemukan',
            }, { status: 404 });
        }
        const kelompokData = kelompokDoc.data();
        const kodeKelompok = kelompokData?.kode;

        if (!kodeKelompok) {
            return NextResponse.json({
                success: false,
                message: 'Kode kelompok tidak valid',
            }, { status: 400 });
        }

        // Get tahun akademik untuk angkatan
        const tahunAkademikDoc = await adminDb.collection('tahun_akademik').doc(tahun_akademik_id).get();
        if (!tahunAkademikDoc.exists) {
            return NextResponse.json({
                success: false,
                message: 'Tahun akademik tidak ditemukan',
            }, { status: 404 });
        }
        const tahunAkademikData = tahunAkademikDoc.data();
        const tahunString = tahunAkademikData?.tahun as string; // "2026/2027"
        const angkatan = parseInt(tahunString.split('/')[0]); // 2026

        // Generate no_induk
        const no_induk = await generateNoInduk(angkatan, kodeKelompok);

        // Check if siswa with same no_induk already exists
        const existingSiswaSnapshot = await adminDb
            .collection('master_siswa')
            .where('no_induk', '==', no_induk)
            .limit(1)
            .get();

        let siswaId: string;

        if (!existingSiswaSnapshot.empty) {
            // Siswa sudah ada, gunakan yang existing
            siswaId = existingSiswaSnapshot.docs[0].id;
        } else {
            // Create new siswa (master data)
            const siswaRef = await adminDb.collection('master_siswa').add({
                no_induk,
                nama_lengkap,
                angkatan,
                created_at: new Date().toISOString(),
            });
            siswaId = siswaRef.id;

            // Create user account with default password
            const defaultPassword = 'password';
            const passwordHash = await bcrypt.hash(defaultPassword, 10);

            await adminDb.collection('users').add({
                code: no_induk,
                role: 'siswa',
                password_hash: passwordHash,
                siswa_id: siswaId,
                nama: nama_lengkap,
                created_at: new Date().toISOString(),
            });
        }

        // Check if enrollment already exists
        const existingEnrollmentSnapshot = await adminDb
            .collection('siswa_enrollment')
            .where('tahun_akademik_id', '==', tahun_akademik_id)
            .where('siswa_id', '==', siswaId)
            .limit(1)
            .get();

        if (!existingEnrollmentSnapshot.empty) {
            return NextResponse.json({
                success: false,
                message: 'Siswa sudah terdaftar di tahun akademik ini',
            }, { status: 400 });
        }

        // Create enrollment
        const enrollmentRef = await adminDb.collection('siswa_enrollment').add({
            tahun_akademik_id,
            siswa_id: siswaId,
            kelompok_id,
            status: 'aktif',
            tanggal_daftar: new Date().toISOString(),
            created_at: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: 'Siswa berhasil didaftarkan',
            data: {
                siswa_id: siswaId,
                enrollment_id: enrollmentRef.id,
                no_induk,
                nama_lengkap,
                angkatan,
            },
        });
    } catch (error) {
        console.error('Enrollment error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat mendaftarkan siswa',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

/**
 * GET /api/enrollment?tahun_akademik_id=xxx
 * Get all enrollments for a tahun akademik
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tahun_akademik_id = searchParams.get('tahun_akademik_id');

        if (!tahun_akademik_id) {
            return NextResponse.json({
                success: false,
                message: 'tahun_akademik_id required',
            }, { status: 400 });
        }

        // Get enrollments
        const enrollmentsSnapshot = await adminDb
            .collection('siswa_enrollment')
            .where('tahun_akademik_id', '==', tahun_akademik_id)
            .get();

        // Sort in memory instead of Firestore (to avoid index requirement)
        const docs = enrollmentsSnapshot.docs.sort((a, b) => {
            const aTime = a.data().created_at || '';
            const bTime = b.data().created_at || '';
            return String(bTime).localeCompare(String(aTime)); // DESC order
        });

        const enrollmentData = docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        const siswaIds = Array.from(new Set(
            enrollmentData
                .map(e => e.siswa_id)
                .filter((id): id is string => typeof id === 'string' && id.length > 0)
        ));

        const kelompokIds = Array.from(new Set(
            enrollmentData
                .map(e => e.kelompok_id)
                .filter((id): id is string => typeof id === 'string' && id.length > 0)
        ));

        const [siswaSnapshots, kelompokSnapshots] = await Promise.all([
            Promise.all(siswaIds.map(id => adminDb.collection('master_siswa').doc(id).get())),
            Promise.all(kelompokIds.map(id => adminDb.collection('master_kelompok').doc(id).get())),
        ]);

        const siswaMap = new Map(
            siswaSnapshots
                .filter(snap => snap.exists)
                .map(snap => [snap.id, { id: snap.id, ...snap.data() }])
        );

        const kelompokMap = new Map(
            kelompokSnapshots
                .filter(snap => snap.exists)
                .map(snap => [snap.id, { id: snap.id, ...snap.data() }])
        );

        const enrollments = enrollmentData.map(enrollment => ({
            ...enrollment,
            siswa: enrollment.siswa_id ? (siswaMap.get(enrollment.siswa_id) || null) : null,
            kelompok: enrollment.kelompok_id ? (kelompokMap.get(enrollment.kelompok_id) || null) : null,
        }));

        return NextResponse.json({
            success: true,
            data: enrollments,
        });
    } catch (error) {
        console.error('Get enrollment error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
