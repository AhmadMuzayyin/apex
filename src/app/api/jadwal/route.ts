import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../_lib/firebaseAdmin';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tahun_akademik_id = searchParams.get('tahun_akademik_id');
        const tanggal = searchParams.get('tanggal');
        const hari = searchParams.get('hari');

        if (!tahun_akademik_id) {
            return NextResponse.json({
                success: false,
                message: 'tahun_akademik_id required',
            }, { status: 400 });
        }

        let query = adminDb.collection('master_jadwal');
        
        // Filter by tahun akademik
        let snapshot = await query
            .where('tahun_akademik_id', '==', tahun_akademik_id)
            .get();

        let jadwal = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[];

        // Filter by hari if provided
        if (hari) {
            jadwal = jadwal.filter((j: any) => j.hari === hari);
        }

        // If tanggal provided, determine hari and filter
        if (tanggal && !hari) {
            const date = new Date(tanggal);
            const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc
            const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const hariName = hariNames[dayOfWeek];
            jadwal = jadwal.filter((j: any) => j.hari === hariName);
        }

        const materiIds = Array.from(new Set(
            jadwal
                .map((j: any) => j.materi_id)
                .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
        ));
        const kelompokIds = Array.from(new Set(
            jadwal
                .map((j: any) => j.kelompok_id)
                .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
        ));
        const tahapIds = Array.from(new Set(
            jadwal
                .map((j: any) => j.tahap_id)
                .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
        ));

        const [materiSnapshots, kelompokSnapshots, tahapSnapshots] = await Promise.all([
            Promise.all(materiIds.map(id => adminDb.collection('master_materi').doc(id).get())),
            Promise.all(kelompokIds.map(id => adminDb.collection('master_kelompok').doc(id).get())),
            Promise.all(tahapIds.map(id => adminDb.collection('master_tahap').doc(id).get())),
        ]);

        const materiMap = new Map(
            materiSnapshots
                .filter(snap => snap.exists)
                .map(snap => [snap.id, { id: snap.id, ...snap.data() }])
        );
        const kelompokMap = new Map(
            kelompokSnapshots
                .filter(snap => snap.exists)
                .map(snap => [snap.id, { id: snap.id, ...snap.data() }])
        );
        const tahapMap = new Map(
            tahapSnapshots
                .filter(snap => snap.exists)
                .map(snap => [snap.id, { id: snap.id, ...snap.data() }])
        );

        const enrichedJadwal = jadwal.map((j: any) => ({
            ...j,
            materi: j.materi_id ? (materiMap.get(j.materi_id) || null) : null,
            kelompok: j.kelompok_id ? (kelompokMap.get(j.kelompok_id) || null) : null,
            tahap: j.tahap_id ? (tahapMap.get(j.tahap_id) || null) : null,
        }));

        // Sort by jam_mulai
        enrichedJadwal.sort((a, b) => {
            return (a.jam_mulai || '').localeCompare(b.jam_mulai || '');
        });

        return NextResponse.json({
            success: true,
            data: enrichedJadwal,
        });
    } catch (error) {
        console.error('Get jadwal error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data jadwal',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
