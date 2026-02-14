import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../_lib/firebaseAdmin';

interface SiswaScore {
  siswa_id: string;
  nama_lengkap: string;
  no_induk: string;
  kelompok_id: string;
  kelompok_nama: string;
  total_nilai: number;
  jumlah_nilai: number;
  rata_rata: number;
}

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

        // Get all enrollments for this year
        const enrollmentSnapshot = await adminDb
            .collection('siswa_enrollment')
            .where('tahun_akademik_id', '==', tahun_akademik_id)
            .get();

        if (enrollmentSnapshot.empty) {
            return NextResponse.json({
                success: true,
                data: {
                    topPerKelompok: [],
                    overallTop3: [],
                },
            });
        }

        // Get all kelompok
        const kelompokSnapshot = await adminDb.collection('master_kelompok').get();
        const kelompokMap = new Map();
        kelompokSnapshot.docs.forEach(doc => {
            kelompokMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        // Calculate scores for each siswa
        const siswaScores: SiswaScore[] = [];

        for (const enrollDoc of enrollmentSnapshot.docs) {
            const enrollment = enrollDoc.data();
            const siswaId = enrollment.siswa_id;

            // Get siswa data
            const siswaDoc = await adminDb.collection('master_siswa').doc(siswaId).get();
            if (!siswaDoc.exists) continue;
            const siswaData = siswaDoc.data();

            // Get all nilai harian for this siswa
            const nilaiHarianSnapshot = await adminDb
                .collection('nilai_harian')
                .where('siswa_id', '==', siswaId)
                .where('tahun_akademik_id', '==', tahun_akademik_id)
                .get();

            // Get all nilai ulangan for this siswa
            const nilaiUlanganSnapshot = await adminDb
                .collection('nilai_ulangan')
                .where('siswa_id', '==', siswaId)
                .where('tahun_akademik_id', '==', tahun_akademik_id)
                .get();

            // Calculate total
            let totalNilai = 0;
            let jumlahNilai = 0;

            nilaiHarianSnapshot.docs.forEach(doc => {
                const nilai = doc.data().nilai || 0;
                totalNilai += nilai;
                jumlahNilai++;
            });

            nilaiUlanganSnapshot.docs.forEach(doc => {
                const nilai = doc.data().nilai || 0;
                totalNilai += nilai;
                jumlahNilai++;
            });

            if (jumlahNilai > 0) {
                const kelompok = kelompokMap.get(enrollment.kelompok_id);
                siswaScores.push({
                    siswa_id: siswaId,
                    nama_lengkap: siswaData?.nama_lengkap || '-',
                    no_induk: siswaData?.no_induk || '-',
                    kelompok_id: enrollment.kelompok_id,
                    kelompok_nama: kelompok?.nama_kelompok || '-',
                    total_nilai: totalNilai,
                    jumlah_nilai: jumlahNilai,
                    rata_rata: totalNilai / jumlahNilai,
                });
            }
        }

        // Sort by rata_rata descending
        siswaScores.sort((a, b) => b.rata_rata - a.rata_rata);

        // Get top 1 per kelompok
        const topPerKelompok: any[] = [];
        const kelompokSeen = new Set();

        for (const score of siswaScores) {
            if (!kelompokSeen.has(score.kelompok_id)) {
                topPerKelompok.push({
                    rank: topPerKelompok.length + 1,
                    ...score,
                });
                kelompokSeen.add(score.kelompok_id);
            }
        }

        // Sort top per kelompok by rata_rata for overall ranking
        topPerKelompok.sort((a, b) => b.rata_rata - a.rata_rata);

        // Get overall top 3
        const overallTop3 = topPerKelompok.slice(0, 3).map((item, index) => ({
            ...item,
            overall_rank: index + 1,
        }));

        return NextResponse.json({
            success: true,
            data: {
                topPerKelompok,
                overallTop3,
            },
        });
    } catch (error) {
        console.error('Get ranking error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data ranking',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
