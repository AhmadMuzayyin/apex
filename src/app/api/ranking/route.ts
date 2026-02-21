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

        const enrollmentRows = enrollmentSnapshot.docs.map(doc => doc.data());
        const siswaKelompokMap = new Map<string, string>();
        enrollmentRows.forEach((enrollment: any) => {
            if (enrollment?.siswa_id && enrollment?.kelompok_id && !siswaKelompokMap.has(enrollment.siswa_id)) {
                siswaKelompokMap.set(enrollment.siswa_id, enrollment.kelompok_id);
            }
        });

        const siswaIds = Array.from(siswaKelompokMap.keys());
        const [siswaSnapshots, nilaiHarianSnapshot, nilaiUlanganSnapshot] = await Promise.all([
            Promise.all(siswaIds.map(id => adminDb.collection('master_siswa').doc(id).get())),
            adminDb.collection('nilai_harian').where('tahun_akademik_id', '==', tahun_akademik_id).get(),
            adminDb.collection('nilai_ulangan').where('tahun_akademik_id', '==', tahun_akademik_id).get(),
        ]);

        const siswaMap = new Map(
            siswaSnapshots
                .filter(snap => snap.exists)
                .map(snap => [snap.id, snap.data()])
        );

        const nilaiAggMap = new Map<string, { total: number; count: number }>();

        nilaiHarianSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const siswaId = data.siswa_id as string | undefined;
            if (!siswaId || !siswaKelompokMap.has(siswaId)) return;
            const current = nilaiAggMap.get(siswaId) || { total: 0, count: 0 };
            current.total += Number(data.nilai || 0);
            current.count += 1;
            nilaiAggMap.set(siswaId, current);
        });

        nilaiUlanganSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const siswaId = data.siswa_id as string | undefined;
            if (!siswaId || !siswaKelompokMap.has(siswaId)) return;
            const current = nilaiAggMap.get(siswaId) || { total: 0, count: 0 };
            current.total += Number(data.nilai || 0);
            current.count += 1;
            nilaiAggMap.set(siswaId, current);
        });

        const siswaScores: SiswaScore[] = [];
        nilaiAggMap.forEach((agg, siswaId) => {
            if (agg.count === 0) return;
            const siswaData: any = siswaMap.get(siswaId);
            const kelompokId = siswaKelompokMap.get(siswaId) || '';
            const kelompok: any = kelompokMap.get(kelompokId);
            siswaScores.push({
                siswa_id: siswaId,
                nama_lengkap: siswaData?.nama_lengkap || '-',
                no_induk: siswaData?.no_induk || '-',
                kelompok_id: kelompokId,
                kelompok_nama: kelompok?.nama_kelompok || '-',
                total_nilai: agg.total,
                jumlah_nilai: agg.count,
                rata_rata: agg.total / agg.count,
            });
        });

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
